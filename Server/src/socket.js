const jwt = require("jsonwebtoken");
const User = require("../models/User");

const lastSeenUpdates = new Map();
const SEEN_INTERVAL_MS = 60_000;

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
    socket.join(`user:${socket.userId}`);

    User.touchLastSeen(socket.userId).catch(() => {});

    socket.on("typing:start", ({ listingId, peerId }) => {
      if (!listingId || !peerId) return;

      io.to(`user:${peerId}`).emit("typing:start", {
        listingId,
        peerId: socket.userId,
      });
    });

    socket.on("typing:stop", ({ listingId, peerId }) => {
      if (!listingId || !peerId) return;

      io.to(`user:${peerId}`).emit("typing:stop", {
        listingId,
        peerId: socket.userId,
      });
    });

    socket.on("disconnect", () => {});
  });
}

function initSocket(server) {
  const { Server } = require("socket.io");

  const allowedOrigins = (
    process.env.CORS_ORIGIN || "http://localhost:5173"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
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

  io.to(`user:${message.senderId}`).emit("message:new", payload);
  io.to(`user:${message.receiverId}`).emit("message:new", payload);
}

function emitMessagesRead(io, { listingId, readerId, peerId }) {
  if (!io) return;

  io.to(`user:${peerId}`).emit("messages:read", {
    listingId,
    readerId,
    peerId,
  });
}

module.exports = {
  initSocket,
  emitNewMessage,
  emitMessagesRead,
};
