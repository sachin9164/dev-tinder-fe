import { apiClient } from '../lib/api-client';

export async function getBlogs(params = { page: 1, limit: 10 }) {
  const response = await apiClient.get('/blog', { params });
  return response.data;
}

export async function getBlogById(blogId) {
  const response = await apiClient.get(`/blog/${blogId}`);
  return response.data;
}

export async function createBlog(payload) {
  const response = await apiClient.post('/blog', payload);
  return response.data;
}

export async function deleteBlog(blogId) {
  const response = await apiClient.delete(`/blog/${blogId}`);
  return response.data;
}

export async function reactToBlog(blogId, likedUserId, status = 'liked') {
  const response = await apiClient.post('/like/blog', {
    blogId,
    likedUserId,
    status,
  });
  return response.data;
}
