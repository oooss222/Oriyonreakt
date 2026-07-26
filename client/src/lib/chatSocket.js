import { io } from "socket.io-client";

const TOKEN_KEY = "auth_token";

let socket = null;

export function getChatSocket() {
  return socket;
}

export function connectChatSocket(token = localStorage.getItem(TOKEN_KEY) || "") {
  if (!token) {
    disconnectChatSocket();
    return null;
  }

  if (socket?.connected && socket.auth?.token === token) {
    return socket;
  }

  disconnectChatSocket();

  socket = io(window.location.origin, {
    auth: { token },
    path: "/socket.io",
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  return socket;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
