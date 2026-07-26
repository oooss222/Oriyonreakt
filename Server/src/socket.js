const jwt = require("jsonwebtoken");
const User = require("./models/User");

const lastSeenUpdates = new Map();
const SEEN_INTERVAL_MS = 30_000;

/** @type {Map<string, number>} */
const onlineUsers = new Map();

function touchLastSeenThrottled(userId) {
  const now = Date.now();
  const last = lastSeenUpdates.get(userId) || 0;

  if (now - last < SEEN_INTERVAL_MS) {
    return Promise.resolve(null);
  }

  lastSeenUpdates.set(userId, now);

  return User.touchLastSeen(userId);
}

function broadcastPresence(io, userId, online, lastSeen) {
  io.emit("presence:update", {
    userId: String(userId),
    online: Boolean(online),
    lastSeen: lastSeen || new Date().toISOString(),
  });
}

function attachSocketHandlers(io) {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

      if (!token) {
        return next(new Error("No token"));
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const id = String(payload.id || payload._id || payload.userId || "");

      if (!id) {
        return next(new Error("Invalid token"));
      }

      const user = await User.findById(id);

      if (!user || user.isBlocked) {
        return next(new Error("Unauthorized"));
      }

      socket.userId = user.id;
      socket.userRole = user.role || "user";

      next();
    } catch (e) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = String(socket.userId);

    socket.join(`user:${String(userId)}`);

    const prev = onlineUsers.get(userId) || 0;
    onlineUsers.set(userId, prev + 1);

    touchLastSeenThrottled(userId)
      .then((user) => {
        const lastSeen = user?.lastSeen || new Date().toISOString();

        socket.emit("presence:snapshot", {
          onlineUserIds: [...onlineUsers.keys()],
        });

        if (prev === 0) {
          broadcastPresence(io, userId, true, lastSeen);
        }
      })
      .catch(() => {
        if (prev === 0) {
          broadcastPresence(io, userId, true, new Date().toISOString());
        }
      });

    socket.on("presence:heartbeat", async () => {
      try {
        const user = await touchLastSeenThrottled(userId);

        broadcastPresence(
          io,
          userId,
          true,
          user?.lastSeen || new Date().toISOString()
        );
      } catch {
        /* ignore */
      }
    });

    socket.on("typing:start", ({ listingId, peerId }) => {
      if (!listingId || !peerId) return;

      io.to(`user:${String(peerId)}`).emit("typing:start", {
        listingId,
        peerId: socket.userId,
      });
    });

    socket.on("typing:stop", ({ listingId, peerId }) => {
      if (!listingId || !peerId) return;

      io.to(`user:${String(peerId)}`).emit("typing:stop", {
        listingId,
        peerId: socket.userId,
      });
    });

    socket.on("disconnect", () => {
      const count = onlineUsers.get(userId) || 0;

      if (count <= 1) {
        onlineUsers.delete(userId);
        touchLastSeenThrottled(userId)
          .then((user) => {
            broadcastPresence(
              io,
              userId,
              false,
              user?.lastSeen || new Date().toISOString()
            );
          })
          .catch(() => {
            broadcastPresence(io, userId, false, new Date().toISOString());
          });
      } else {
        onlineUsers.set(userId, count - 1);
      }
    });
  });
}

const { getAllowedOrigins, isOriginAllowed } = require("./corsOrigins");

function initSocket(server) {
  const { Server } = require("socket.io");

  const allowedOrigins = getAllowedOrigins();

  const io = new Server(server, {
    cors: {
      origin(origin, callback) {
        if (isOriginAllowed(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS: Origin not allowed: ${origin}`));
      },
      credentials: true,
    },
    path: "/socket.io",
  });

  attachSocketHandlers(io);

  return io;
}

function emitNewMessage(io, message) {
  if (!io || !message) return;

  const payload = {
    message,
    listingId: message.listingId,
  };

  io.to(`user:${String(message.senderId)}`).emit("message:new", payload);
  io.to(`user:${String(message.receiverId)}`).emit("message:new", payload);
}

function emitMessagesRead(io, { listingId, readerId, peerId, messageIds = [] }) {
  if (!io) return;

  io.to(`user:${String(peerId)}`).emit("messages:read", {
    listingId,
    readerId,
    peerId,
    messageIds,
  });
}

module.exports = {
  initSocket,
  emitNewMessage,
  emitMessagesRead,
};
