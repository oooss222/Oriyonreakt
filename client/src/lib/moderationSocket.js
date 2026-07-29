import React from "react";
import { connectChatSocket } from "../lib/chatSocket";
import { TOKEN_KEY } from "./auth";

export function subscribeModerationQueue(callback) {
  const token = localStorage.getItem(TOKEN_KEY) || "";

  if (!token) {
    return () => {};
  }

  const socket = connectChatSocket(token);

  if (!socket) {
    return () => {};
  }

  const handler = (payload) => {
    callback?.(payload);
  };

  socket.on("moderation:queue", handler);

  return () => {
    socket.off("moderation:queue", handler);
  };
}
