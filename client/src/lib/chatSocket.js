const TOKEN_KEY = "auth_token";

let socket = null;
let connecting = null;

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
    return Promise.resolve(null);
  }

  if (socket?.connected && socket.auth?.token === token) {
    return Promise.resolve(socket);
  }

  if (connecting) return connecting;

  connecting = import("socket.io-client")
    .then(({ io }) => {
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
    })
    .finally(() => {
      connecting = null;
    });

  return connecting;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
