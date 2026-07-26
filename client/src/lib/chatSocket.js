import { io } from "socket.io-client";

const TOKEN_KEY = "auth_token";

let socket = null;

function getSocketUrl() {
  const apiBase =
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_API_URL ||
    "";

  if (apiBase.startsWith("http")) {
    try {
      const url = new URL(apiBase.replace(/\/$/, ""));

      if (url.pathname.endsWith("/api")) {
        url.pathname = url.pathname.slice(0, -4) || "/";
      }

      return url.origin;
    } catch {
      /* fall through */
    }
  }

  return window.location.origin;
}

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

  socket = io(getSocketUrl(), {
    auth: { token },
    path: "/socket.io",
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
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
