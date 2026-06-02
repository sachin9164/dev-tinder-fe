import { useEffect, useState } from 'react';
import { MessageCircle, SendHorizontal } from 'lucide-react';
import { EmptyState } from '../components/common/empty-state';
import { LoadingState } from '../components/common/loading-state';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { cn } from '../lib/utils';
import { getConnections } from '../services/user-service';
import { getChatByUserId } from '../services/chat-service';
import { parseApiError } from '../lib/api-client';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket-client';
import { useAuth } from '../hooks/use-auth';

const JOIN_CHAT_EVENT =
  import.meta.env.VITE_SOCKET_JOIN_EVENT || 'chat:join';

const OUTGOING_MESSAGE_EVENT =
  import.meta.env.VITE_SOCKET_SEND_MESSAGE_EVENT || 'chat:message:send';

const INCOMING_MESSAGE_EVENT =
  import.meta.env.VITE_SOCKET_RECEIVE_MESSAGE_EVENT || 'chat:receiveMessage';


function formatName(user) {
  return `${user?.firstName || user?.firstname || ''} ${user?.lastName || user?.lastname || ''}`.trim();
}

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getMatchId(match, fallbackIndex = 0) {
  return match?._id || `match-${fallbackIndex}`;
}

function extractFirstName(value = '') {
  return String(value).trim().split(' ')[0] || '';
}

function getSenderId(sender) {
  if (!sender) return '';
  return sender._id || sender.id || sender;
}

function normalizeStoredMessage(message, currentUserId) {
  const sender = message?.senderID;
  const senderId = getSenderId(sender);

  return {
    id: message?._id || `${senderId}-${message?.createdAt || Date.now()}`,
    from: String(senderId) === String(currentUserId) ? 'me' : 'them',
    firstName: sender?.firstName || sender?.firstname || '',
    text: message?.content || message?.message || message?.text || '',
    createdAt: message?.createdAt || new Date().toISOString(),
  };
}

export function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [activeMatchId, setActiveMatchId] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [messagesByMatch, setMessagesByMatch] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMatches() {
      try {
        const response = await getConnections();
        const nextMatches = response?.data || [];
        setMatches(nextMatches);

        if (nextMatches.length > 0) {
          setActiveMatchId((prev) => prev || getMatchId(nextMatches[0], 0));
        }

        setMessagesByMatch((prev) =>
          nextMatches.reduce((acc, match, index) => {
            const id = getMatchId(match, index);
            acc[id] = prev[id] || [];

            return acc;
          }, {})
        );
      } catch (requestError) {
        setError(parseApiError(requestError));
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, []);


  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    const socket = connectSocket({ userId });

    function handleConnect() {
      setError('');
    }

    function handleIncomingMessage(payload = {}) {
      const senderId = payload.fromUserId || payload.senderId || payload.userId || payload.from;
      const targetId = payload.toUserId || payload.to;
      const partnerId = senderId === userId ? targetId : senderId;
      const messageText = payload.message || payload.text;

      if (!partnerId || !messageText) return;

      setMessagesByMatch((prev) => ({
        ...prev,
        [partnerId]: [
          ...(prev[partnerId] || []),
          {
            id: payload.id || `${partnerId}-${Date.now()}`,
            from: senderId === userId ? 'me' : 'them',
            firstName: payload.firstname || payload.firstName || '',
            text: messageText,
            createdAt: payload.createdAt || new Date().toISOString(),
          },
        ],
      }));
    }

    function handleConnectError(connectionError) {
      setError(connectionError?.message || 'Socket connection failed');
    }

    socket.on('connect', handleConnect);
    socket.on(INCOMING_MESSAGE_EVENT, handleIncomingMessage);
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off(INCOMING_MESSAGE_EVENT, handleIncomingMessage);
      socket.off('connect_error', handleConnectError);
      disconnectSocket();
    };
  }, [ user , activeMatchId]);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!activeMatchId || !userId) return;

    let isCancelled = false;

    async function loadChatHistory() {
      try {
        const chat = await getChatByUserId(activeMatchId);
        if (isCancelled) return;

        const nextMessages = Array.isArray(chat?.messages)
          ? chat.messages
              .map((message) => normalizeStoredMessage(message, userId))
              .filter((message) => message.text)
          : [];

        setMessagesByMatch((prev) => ({
          ...prev,
          [activeMatchId]: nextMessages,
        }));
      } catch (requestError) {
        if (!isCancelled) {
          setError(parseApiError(requestError));
        }
      }
    }

    loadChatHistory();

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(JOIN_CHAT_EVENT, {
      userId,
      targetUserId: activeMatchId,
      toUserId: activeMatchId,
    });

    return () => {
      isCancelled = true;
    };
  }, [activeMatchId, user]);

  if (loading) {
    return <LoadingState text="Finding your matches..." />;
  }

  const activeMatch =
    matches.find((match, index) => getMatchId(match, index) === activeMatchId) ||
    null;
  const activeMessages = messagesByMatch[activeMatchId] || [];

  const handleSendMessage = (event) => {
    event.preventDefault();

    if (!draftMessage.trim() || !activeMatchId) return;

    const trimmedMessage = draftMessage.trim();

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(OUTGOING_MESSAGE_EVENT, {
      firstname: user?.firstName,
      userId: user?._id || user?.id,
      toUserId: activeMatchId,
      message: trimmedMessage,
    });

    const nextMessage = {
      id: `${activeMatchId}-${Date.now()}`,
      from: 'me',
      firstName: user?.firstName || '',
      text: trimmedMessage,
      createdAt: new Date().toISOString(),
    };

    setMessagesByMatch((prev) => ({
      ...prev,
      [activeMatchId]: [...(prev[activeMatchId] || []), nextMessage],
    }));

    setDraftMessage('');
  };

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Matches</h1>
        <p className="text-sm text-slate-600">
          Connections you can start chatting with.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {matches.length === 0 ? (
        <EmptyState
          title="No matches yet"
          description="Start swiping in Discover to find your first match."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="grid h-[560px] grid-cols-1 md:grid-cols-[280px_1fr]">
              <aside className="border-b border-slate-200/80 md:border-b-0 md:border-r">
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">Conversations</p>
                  <p className="text-xs text-slate-500">Select a match to start chatting</p>
                </div>
                <ScrollArea className="h-[220px] md:h-[500px]">
                  <div className="space-y-1 px-2 pb-3">
                    {matches.map((match, index) => {
                      const matchId = getMatchId(match, index);
                      const isActive = matchId === activeMatchId;

                      return (
                        <button
                          key={matchId}
                          type="button"
                          onClick={() => setActiveMatchId(matchId)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition',
                            isActive
                              ? 'bg-rose-50 ring-1 ring-rose-200'
                              : 'hover:bg-slate-50'
                          )}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={match.photoUrl} alt={formatName(match)} />
                            <AvatarFallback>
                              {formatName(match).slice(0, 2).toUpperCase() || 'DT'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {formatName(match) || 'Developer'}
                            </p>
                            <p className="truncate text-xs text-slate-500">{match.email}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </aside>

              <div className="flex h-full flex-col">
                {activeMatch ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={activeMatch.photoUrl}
                            alt={formatName(activeMatch)}
                          />
                          <AvatarFallback>
                            {formatName(activeMatch).slice(0, 2).toUpperCase() || 'DT'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatName(activeMatch) || 'Developer'}
                          </p>
                          <p className="text-xs text-slate-500">{activeMatch.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        Chat Ready
                      </Badge>
                    </div>

                    <ScrollArea className="h-[230px] px-4 py-3 md:h-[390px]">
                      <div className="space-y-3">
                        {activeMessages.map((message) => {
                          const isMine = message.from === 'me';
                          const displayFirstName =
                            message.firstName ||
                            (isMine
                              ? user?.firstName || 'You'
                              : extractFirstName(formatName(activeMatch)) || 'User');

                          return (
                            <div
                              key={message.id}
                              className={cn(
                                'flex',
                                isMine ? 'justify-end' : 'justify-start'
                              )}
                            >
                              <div
                                className={cn(
                                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                                  isMine
                                    ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white'
                                    : 'border border-slate-200 bg-white text-slate-700'
                                )}
                              >
                                <p
                                  className={cn(
                                    'mb-1 text-[11px] font-semibold',
                                    isMine ? 'text-white/90' : 'text-slate-500'
                                  )}
                                >
                                  {displayFirstName}
                                </p>
                                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                                <p
                                  className={cn(
                                    'mt-1 text-[10px]',
                                    isMine ? 'text-white/80' : 'text-slate-400'
                                  )}
                                >
                                  {formatTime(message.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    <form
                      className="mt-auto border-t border-slate-200/80 px-4 py-3"
                      onSubmit={handleSendMessage}
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          value={draftMessage}
                          onChange={(event) => setDraftMessage(event.target.value)}
                          placeholder="Type a message..."
                        />
                        <Button type="submit" size="sm" disabled={!draftMessage.trim()}>
                          <SendHorizontal className="h-4 w-4" />
                          Send
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center px-4">
                    <EmptyState
                      title="Choose a conversation"
                      description="Pick a match from the left to open chat."
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
