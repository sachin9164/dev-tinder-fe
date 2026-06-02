import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, Heart, Mail, Trash2, UserRound } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '../components/common/empty-state';
import { LoadingState } from '../components/common/loading-state';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../hooks/use-auth';
import { parseApiError } from '../lib/api-client';
import { deleteBlog, getBlogById, reactToBlog } from '../services/blog-service';



function formatAuthor(author) {
  return `${author?.firstName || ''} ${author?.lastName || ''}`.trim() || 'Unknown Author';
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isBlogLikedByUser(blog, userId) {
  if (!blog || !userId) return false;

  if (blog?.isLiked === true || blog?.likedByMe === true) return true;
  if (blog?.currentUserReaction === 'liked') return true;

  if (Array.isArray(blog?.likes)) {
    return blog.likes.some((likeEntry) => {
      if (!likeEntry) return false;
      if (typeof likeEntry === 'string') return likeEntry === userId;
      if (typeof likeEntry === 'object') {
        return (
          likeEntry === userId ||
          likeEntry?._id === userId ||
          likeEntry?.userId === userId ||
          likeEntry?.fromUserId === userId
        );
      }
      return false;
    });
  }

  return false;
}

export function BlogDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadBlog() {
      try {
        const response = await getBlogById(id);
        if (!isMounted) return;
        const blogData = response?.data || null;
        setBlog(blogData);
        setLiked(isBlogLikedByUser(blogData, user?._id));
      } catch (requestError) {
        if (!isMounted) return;
        setError(parseApiError(requestError));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBlog();

    return () => {
      isMounted = false;
    };
  }, [id, user?._id]);

  if (loading) {
    return <LoadingState text="Loading blog details..." />;
  }

  if (error) {
    return (
      <section className="space-y-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/blogs">
            <ChevronLeft className="h-4 w-4" />
            Back to Blogs
          </Link>
        </Button>
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      </section>
    );
  }

  if (!blog) {
    return (
      <section className="space-y-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/blogs">
            <ChevronLeft className="h-4 w-4" />
            Back to Blogs
          </Link>
        </Button>
        <EmptyState title="Blog not found" description="This blog may have been deleted." />
      </section>
    );
  }

  const author = blog?.author || {};
  const authorName = formatAuthor(author);
  const initials = `${author?.firstName?.[0] || ''}${author?.lastName?.[0] || ''}`.toUpperCase();
  const canDelete = Boolean(author?._id && user?._id && author._id === user._id);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError('');
      await deleteBlog(blog?._id);
      navigate('/blogs', { replace: true });
    } catch (requestError) {
      setError(parseApiError(requestError));
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleLike = async () => {
    const likedUserId = blog?.author?._id;
    if (!blog?._id || !likedUserId || reacting) return;

    const currentlyLiked = liked;
    const nextStatus = currentlyLiked ? 'disliked' : 'liked';

    setReacting(true);
    setError('');
    setLiked(!currentlyLiked);

    try {
      await reactToBlog(blog._id, likedUserId, nextStatus);
    } catch (requestError) {
      setLiked(currentlyLiked);
      setError(parseApiError(requestError));
    } finally {
      setReacting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/blogs">
            <ChevronLeft className="h-4 w-4" />
            Back to Blogs
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={handleToggleLike} disabled={reacting}>
          <Heart className={liked ? 'h-4 w-4 fill-rose-500 text-rose-500' : 'h-4 w-4'} />
          {liked ? 'Liked' : 'Like'}
        </Button>
        {canDelete ? (
          <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl">{blog?.title || 'Untitled post'}</CardTitle>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(blog?.createdAt)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-2">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-3">
            <Avatar className="h-11 w-11">
              <AvatarImage src={author?.photoUrl} alt={authorName} />
              <AvatarFallback>{initials || 'DT'}</AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <UserRound className="h-3.5 w-3.5 text-slate-500" />
                {authorName}
              </p>
              {author?.email ? (
                <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Mail className="h-3.5 w-3.5" />
                  {author.email}
                </p>
              ) : null}
            </div>
          </div>

          <article className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{blog?.content || 'No content'}</article>
        </CardContent>
      </Card>
    </section>
  );
}
