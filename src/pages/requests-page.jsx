import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { EmptyState } from '../components/common/empty-state';
import { LoadingState } from '../components/common/loading-state';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { reviewRequest } from '../services/request-service';
import { getReceivedRequests } from '../services/user-service';
import { parseApiError } from '../lib/api-client';

function formatName(user) {
  return `${user?.firstName || user?.firstname || ''} ${user?.lastName || user?.lastname || ''}`.trim();
}

export function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    try {
      const response = await getReceivedRequests();
      setRequests(response?.data || []);
    } catch (requestError) {
      setError(parseApiError(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleReview = async (status, requestId) => {
    try {
      await reviewRequest(status, requestId);
      setRequests((prev) => prev.filter((item) => item._id !== requestId));
    } catch (requestError) {
      setError(parseApiError(requestError));
    }
  };

  if (loading) {
    return <LoadingState text="Fetching pending requests..." />;
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Requests</h1>
        <p className="text-sm text-slate-600">
          People who are interested in your profile.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {requests.length === 0 ? (
        <EmptyState
          title="No pending requests"
          description="You are all caught up."
        />
      ) : (
        <div className="grid gap-3">
          {requests.map((item) => {
            const fromUser = item?.fromUserId || {};

            return (
              <Card key={item._id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={fromUser.photoUrl}
                        alt={formatName(fromUser)}
                      />
                      <AvatarFallback>
                        {formatName(fromUser).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {formatName(fromUser) || 'Developer'}
                      </p>
                      <p className="text-xs text-slate-500">{fromUser.email}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleReview('rejected', item._id)}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button onClick={() => handleReview('accepted', item._id)}>
                      <Check className="h-4 w-4" />
                      Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
