import { useEffect, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
  PencilLine,
  Trash2,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/common/empty-state';
import { LoadingState } from '../components/common/loading-state';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../hooks/use-auth';
import { parseApiError } from '../lib/api-client';
import {
  createBlog,
  deleteBlog,
  getBlogs,
  reactToBlog,
} from '../services/blog-service';

const PAGE_SIZE = 3;

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

export function BlogsPage() {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [likedBlogs, setLikedBlogs] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [paging, setPaging] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deletingBlogId, setDeletingBlogId] = useState('');
  const [reactingBlogId, setReactingBlogId] = useState('');
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const loadBlogs = async (nextPage) => {
    try {
      setError('');
      const response = await getBlogs({ page: nextPage, limit: PAGE_SIZE });
      const nextBlogs = response?.data || [];
      setBlogs(nextBlogs);
      setLikedBlogs(
        nextBlogs.reduce((acc, blog) => {
          if (blog?._id) {
            acc[blog._id] = isBlogLikedByUser(blog, user?._id);
          }
          return acc;
        }, {})
      );
      setPage(nextPage);
    } catch (requestError) {
      setError(parseApiError(requestError));
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadInitialBlogs() {
      try {
        const response = await getBlogs({ page: 1, limit: PAGE_SIZE });
        if (!isMounted) return;
        const nextBlogs = response?.data || [];
        setBlogs(nextBlogs);
        setLikedBlogs(
          nextBlogs.reduce((acc, blog) => {
            if (blog?._id) {
              acc[blog._id] = isBlogLikedByUser(blog, user?._id);
            }
            return acc;
          }, {})
        );
      } catch (requestError) {
        if (!isMounted) return;
        setError(parseApiError(requestError));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInitialBlogs();

    return () => {
      isMounted = false;
    };
  }, [user?._id]);

  const hasNextPage = blogs.length === PAGE_SIZE;

  const handlePageChange = async (nextPage) => {
    if (nextPage < 1 || (nextPage > page && !hasNextPage) || paging) return;

    setPaging(true);
    await loadBlogs(nextPage);
    setPaging(false);
  };

  const handlePublish = async (event) => {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    try {
      setPublishing(true);
      setError('');
      await createBlog({
        title: title.trim(),
        content: content.trim(),
      });
      setTitle('');
      setContent('');
      setPublishDialogOpen(false);
      await loadBlogs(1);
    } catch (requestError) {
      setError(parseApiError(requestError));
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (blogId) => {
    if (!blogId || deletingBlogId) return;

    try {
      setDeletingBlogId(blogId);
      setError('');
      await deleteBlog(blogId);

      const updatedBlogs = blogs.filter((blog) => blog?._id !== blogId);
      setBlogs(updatedBlogs);
      setLikedBlogs((prev) => {
        const next = { ...prev };
        delete next[blogId];
        return next;
      });

      if (updatedBlogs.length === 0 && page > 1) {
        await loadBlogs(page - 1);
      }
    } catch (requestError) {
      setError(parseApiError(requestError));
    } finally {
      setDeletingBlogId('');
    }
  };

  const canDeleteBlog = (blog) => {
    const authorId = blog?.author?._id;
    return Boolean(authorId && user?._id && authorId === user._id);
  };

  const handleToggleLike = async (blogId, likedUserId) => {
    if (!blogId || !likedUserId || reactingBlogId) return;

    const currentlyLiked = Boolean(likedBlogs[blogId]);
    const nextStatus = currentlyLiked ? 'disliked' : 'liked';

    setReactingBlogId(blogId);
    setError('');
    setLikedBlogs((prev) => ({
      ...prev,
      [blogId]: !currentlyLiked,
    }));

    try {
      await reactToBlog(blogId, likedUserId, nextStatus);
    } catch (requestError) {
      setLikedBlogs((prev) => ({
        ...prev,
        [blogId]: currentlyLiked,
      }));
      setError(parseApiError(requestError));
    } finally {
      setReactingBlogId('');
    }
  };

  if (loading) {
    return <LoadingState text="Loading blogs..." />;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blogs</h1>
          <p className="text-sm text-slate-600">Read the latest developer posts from the community.</p>
        </div>

        <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PencilLine className="h-4 w-4" />
              Write Blog
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Blog</DialogTitle>
              <DialogDescription>
                Share what you are building or learning.
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-3" onSubmit={handlePublish}>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Blog title"
                maxLength={120}
              />
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write your blog content"
                className="min-h-[160px]"
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={publishing}>
                  {publishing ? 'Publishing...' : 'Publish'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {blogs.length === 0 ? (
        <EmptyState
          title="No blog posts yet"
          description="Check back later for new posts from the community."
        />
      ) : (
        <div className="grid gap-3">
          {blogs.map((blog) => (
            <Card key={blog?._id}>
              <CardHeader className="space-y-2 pb-1">
                <CardTitle className="text-lg">{blog?.title || 'Untitled post'}</CardTitle>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="h-3.5 w-3.5" />
                    {formatAuthor(blog?.author)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(blog?.createdAt)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {(blog?.content || 'No content').slice(0, 220)}
                  {blog?.content && blog.content.length > 220 ? '...' : ''}
                </p>
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/blogs/${blog?._id}`}>Read more</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleLike(blog?._id, blog?.author?._id)}
                      disabled={reactingBlogId === blog?._id}
                    >
                      <Heart
                        className={likedBlogs[blog?._id] ? 'h-4 w-4 fill-rose-500 text-rose-500' : 'h-4 w-4'}
                      />
                      {likedBlogs[blog?._id] ? 'Liked' : 'Like'}
                    </Button>
                    {canDeleteBlog(blog) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(blog?._id)}
                        disabled={deletingBlogId === blog?._id}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingBlogId === blog?._id ? 'Deleting...' : 'Delete'}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-3 py-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1 || paging}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm font-medium text-slate-700">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={!hasNextPage || paging}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
