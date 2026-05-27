import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { EmptyState } from '../components/common/empty-state';
import { LoadingState } from '../components/common/loading-state';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { getConnections } from '../services/user-service';
import { parseApiError } from '../lib/api-client';

function formatName(user) {
  return `${user?.firstName || user?.firstname || ''} ${user?.lastName || user?.lastname || ''}`.trim();
}

export function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMatches() {
      try {
        const response = await getConnections();
        setMatches(response?.data || []);
      } catch (requestError) {
        setError(parseApiError(requestError));
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, []);

  if (loading) {
    return <LoadingState text="Finding your matches..." />;
  }

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
            <ScrollArea className="h-[420px]">
              <div className="p-4">
                {matches.map((match, index) => (
                  <div key={match._id || index}>
                    <div className="flex items-center justify-between gap-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={match.photoUrl}
                            alt={formatName(match)}
                          />
                          <AvatarFallback>
                            {formatName(match).slice(0, 2).toUpperCase() ||
                              'DT'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {formatName(match) || 'Developer'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {match.email}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        Matched
                      </Badge>
                    </div>
                    {index !== matches.length - 1 ? <Separator /> : null}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
