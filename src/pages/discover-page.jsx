import { useEffect, useState } from 'react';
import { EmptyState } from '../components/common/empty-state';
import { LoadingState } from '../components/common/loading-state';
import { SwipeCard } from '../components/discovery/swipe-card';
import { sendRequest } from '../services/request-service';
import { getFeed } from '../services/user-service';
import { parseApiError } from '../lib/api-client';

export function DiscoverPage() {
  const [feed, setFeed] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadInitialFeed() {
      try {
        const response = await getFeed({ page: 1, limit: 10 });
        if (!isMounted) return;
        setFeed(response?.data || []);
        setMeta(response?.meta || null);
        setPage(1);
      } catch (requestError) {
        if (!isMounted) return;
        setError(parseApiError(requestError));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInitialFeed();

    return () => {
      isMounted = false;
    };
  }, []);

  const current = feed[0];

  const handleSwipe = async (status) => {
    if (!current?._id) return;

    const swipedUser = current;
    const remaining = feed.slice(1);

    // Advance immediately for a smoother swipe experience.
    setFeed(remaining);
    setError('');
    setBusy(true);

    try {
      await sendRequest(status, swipedUser._id);

      if (remaining.length < 3 && meta?.hasNextPage) {
        const nextPage = page + 1;
        const response = await getFeed({ page: nextPage, limit: 10 });
        setPage(nextPage);
        setMeta(response?.meta || null);
        setFeed((prev) => [...prev, ...(response?.data || [])]);
      }
    } catch (requestError) {
      setFeed((prev) =>
        prev.some((item) => item?._id === swipedUser._id)
          ? prev
          : [swipedUser, ...prev]
      );
      setError(parseApiError(requestError));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <LoadingState text="Loading your developer stack..." />;
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Discover</h1>
        <p className="text-sm text-slate-600">
          Swipe right to connect. Swipe left to skip.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {current ? (
        <SwipeCard
          user={current}
          busy={busy}
          onIgnore={() => handleSwipe('ignored')}
          onInterested={() => handleSwipe('interested')}
        />
      ) : (
        <EmptyState
          title="No more developers in your feed"
          description="Try again later, or update your profile to get better matches."
        />
      )}
    </section>
  );
}
