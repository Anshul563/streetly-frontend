import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = () => {
  if (socket && socket.connected) return socket;

  socket = io("http://localhost:5000", {
    autoConnect: true,
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("Socket connected", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected", reason);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) throw new Error("Socket not initialized");
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
