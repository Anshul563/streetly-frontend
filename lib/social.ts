import { API } from "./api";
import type { AxiosResponse } from "axios";

// Types for API responses
type FollowResponse = { message: string; isFollowing?: boolean };
type IsFollowingResponse = { isFollowing: boolean };
type FeedData<T> = Array<T>;
type LikeResponse = { success: boolean };
type SupportResponse = { success: boolean; supported: boolean };
type CommentResponse = { id: number; [key: string]: unknown };

// Follow status cache
const followStatusCache = new Map<number, { status: boolean; timestamp: number }>();
const FOLLOW_CACHE_TTL = 1000; // 1 second

// Feed data cache (longer TTL since feed data changes less frequently)
const feedDataCache = new Map<string, { data: unknown; timestamp: number }>();
const FEED_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const followUser = async (userId: number): Promise<AxiosResponse<FollowResponse>> => {
  followStatusCache.delete(userId);
  return API.post(`/follow/${userId}`);
};

export const unfollowUser = async (userId: number): Promise<AxiosResponse<FollowResponse>> => {
  followStatusCache.delete(userId);
  return API.delete(`/follow/${userId}`);
};

export const checkIsFollowing = async (userId: number): Promise<AxiosResponse<IsFollowingResponse>> => {
  const now = Date.now();
  const cached = followStatusCache.get(userId);
  
  // Return cached result if still valid
  if (cached && now - cached.timestamp < FOLLOW_CACHE_TTL) {
    return { data: { isFollowing: cached.status } } as AxiosResponse<IsFollowingResponse>;
  }
  
  const res = await API.get(`/follow/${userId}/is-following`, {
    headers: { "Cache-Control": "no-cache" }
  });
  
  // Cache the result
  followStatusCache.set(userId, { status: res.data.isFollowing, timestamp: now });
  
  return res;
};

// Helper to fetch feed data with client-side caching
const getCachedFeedData = async <T>(
  endpoint: string,
  cacheKey: string
): Promise<AxiosResponse<T>> => {
  const now = Date.now();
  const cached = feedDataCache.get(cacheKey);
  
  // Return cached result if still valid
  if (cached && now - cached.timestamp < FEED_CACHE_TTL) {
    return { data: cached.data as T } as AxiosResponse<T>;
  }
  
  const res = await API.get<T>(endpoint, {
    headers: { "Cache-Control": "no-cache" }
  });
  
  // Cache the result
  feedDataCache.set(cacheKey, { data: res.data, timestamp: now });
  
  return res;
};

export const getFeedIssues = <T = unknown>(): Promise<AxiosResponse<T>> =>
  getCachedFeedData<T>("/issues", "feed:issues");
export const getFeedTrending = <T = unknown>(): Promise<AxiosResponse<T>> =>
  getCachedFeedData<T>("/issues/trending", "feed:trending");
export const getFeedTopContributors = <T = unknown>(): Promise<AxiosResponse<T>> =>
  getCachedFeedData<T>("/issues/top-contributors", "feed:top-contributors");

// Clear feed cache when needed (e.g., when creating new issue)
export const clearFeedCache = (): void => {
  feedDataCache.delete("feed:issues");
  feedDataCache.delete("feed:trending");
  feedDataCache.delete("feed:top-contributors");
};

export const likeTarget = async (id: number, type: "issue" | "comment"): Promise<AxiosResponse<LikeResponse>> =>
  API.post(`/like/${id}`, {}, { params: { type } });

export const unlikeTarget = async (id: number, type: "issue" | "comment"): Promise<AxiosResponse<LikeResponse>> =>
  API.delete(`/like/${id}`, { params: { type } });

export const supportTarget = async (id: number, type: "issue" | "comment"): Promise<AxiosResponse<SupportResponse>> =>
  API.post(`/supporters/${id}`, {}, { params: { type } });

export const getSupporters = async (id: number, type: "issue" | "comment"): Promise<AxiosResponse<Array<{ id: number }>>> =>
  API.get(`/supporters/${id}`, { params: { type } });

export const getComments = async (issueId: number): Promise<AxiosResponse<CommentResponse[]>> =>
  API.get(`/comment/${issueId}`);

export const addComment = async (issueId: number, content: string): Promise<AxiosResponse<CommentResponse>> =>
  API.post(`/comment/${issueId}`, { content });
