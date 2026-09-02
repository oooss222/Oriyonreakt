import { connectChatSocket, getChatSocket } from "./chatSocket";
import { TOKEN_KEY } from "./auth";

export function subscribeModerationQueue(callback) {
  const token = localStorage.getItem(TOKEN_KEY) || "";

  if (!token) {
    return () => {};
  }

  let cancelled = false;
  const handler = (payload) => {
    callback?.(payload);
  };

  connectChatSocket(token).then((socket) => {
    if (cancelled || !socket) return;
    socket.on("moderation:queue", handler);
  });

  return () => {
    cancelled = true;
    getChatSocket()?.off("moderation:queue", handler);
  };
}
