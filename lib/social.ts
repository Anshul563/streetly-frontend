import { API } from "./api";

export const followUser = async (userId: number) => API.post(`/follow/${userId}`);
export const unfollowUser = async (userId: number) => API.delete(`/follow/${userId}`);
export const checkIsFollowing = async (userId: number) => API.get(`/follow/${userId}/is-following`);

export const likeTarget = async (id: number, type: "issue" | "comment") =>
  API.post(`/like/${id}`, {}, { params: { type } });
export const unlikeTarget = async (id: number, type: "issue" | "comment") =>
  API.delete(`/like/${id}`, { params: { type } });

export const supportTarget = async (id: number, type: "issue" | "comment") =>
  API.post(`/supporters/${id}`, {}, { params: { type } });
export const getSupporters = async (id: number, type: "issue" | "comment") =>
  API.get(`/supporters/${id}`, { params: { type } });

export const getComments = async (issueId: number) => API.get(`/comment/${issueId}`);
export const addComment = async (issueId: number, content: string) =>
  API.post(`/comment/${issueId}`, { content });
