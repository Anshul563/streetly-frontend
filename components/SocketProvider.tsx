"use client";

import { useEffect } from "react";
import { connectSocket, disconnectSocket } from "@/lib/socket";

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const socket = connectSocket();

    const handlers = {
      "issue.created": (data: any) => {
        console.debug("issue.created", data);
      },
      "comment.created": (data: any) => {
        console.debug("comment.created", data);
      },
      "like.created": (data: any) => {
        console.debug("like.created", data);
      },
      "support.created": (data: any) => {
        console.debug("support.created", data);
      },
    };

    Object.entries(handlers).forEach(([event, fn]) => socket.on(event, fn));

    return () => {
      Object.entries(handlers).forEach(([event, fn]) => socket.off(event, fn));
      disconnectSocket();
    };
  }, []);

  return <>{children}</>;
}
