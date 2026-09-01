const router = require("express").Router();

const auth = require("../middleware/auth");
const Message = require("../models/Message");
const ChatThread = require("../models/ChatThread");
const { emitNewMessage, emitMessagesRead } = require("../socket");
const { messageSendLimiter } = require("../middleware/rateLimit");
const { isAllowedMediaUrl } = require("../lib/mediaUrl");

router.use(auth);

function emitReadReceipt(req, { listingId, readerId, peerId, markedRead, messageIds }) {
  const io = req.app.get("io");

  if (!io || markedRead <= 0) {
    return;
  }

  emitMessagesRead(io, {
    listingId,
    readerId,
    peerId,
    messageIds,
  });
}

router.get("/inbox", async (req, res) => {
  try {
    const archived = req.query.archived === "1" || req.query.archived === "true";

    const data = await Message.inbox({
      userId: req.user.id,
      role: req.user.role,
      archived,
    });

    return res.json(data);
  } catch (e) {
    console.error("MESSAGES_INBOX_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load inbox",
    });
  }
});

router.patch("/threads/:listingId", async (req, res) => {
  try {
    const peerId = req.body?.peerId || req.query.peerId || null;

    if (!peerId) {
      return res.status(400).json({
        error: "peerId is required",
      });
    }

    const patch = {};

    if (typeof req.body?.isArchived === "boolean") {
      patch.isArchived = req.body.isArchived;
    }

    if (typeof req.body?.isMuted === "boolean") {
      patch.isMuted = req.body.isMuted;
    }

    if (!Object.keys(patch).length) {
      return res.status(400).json({
        error: "No settings provided",
      });
    }

    const settings = await ChatThread.upsertSettings(
      req.user.id,
      req.params.listingId,
      peerId,
      patch
    );

    return res.json(settings);
  } catch (e) {
    console.error("MESSAGES_THREAD_SETTINGS_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to update thread settings",
    });
  }
});

router.post("/blocks/:userId", async (req, res) => {
  try {
    await ChatThread.blockUser(req.user.id, req.params.userId);

    return res.json({ ok: true });
  } catch (e) {
    if (e?.message === "CANNOT_BLOCK_SELF") {
      return res.status(400).json({
        error: "Cannot block yourself",
      });
    }

    console.error("MESSAGES_BLOCK_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to block user",
    });
  }
});

router.delete("/blocks/:userId", async (req, res) => {
  try {
    await ChatThread.unblockUser(req.user.id, req.params.userId);

    return res.json({ ok: true });
  } catch (e) {
    console.error("MESSAGES_UNBLOCK_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to unblock user",
    });
  }
});

router.get("/blocks", async (req, res) => {
  try {
    const blockedUserIds = await ChatThread.listBlockedUserIds(req.user.id);

    return res.json({ blockedUserIds });
  } catch (e) {
    console.error("MESSAGES_BLOCKS_LIST_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load blocked users",
    });
  }
});

router.post("/:listingId/read", async (req, res) => {
  try {
    const peerId = req.query.peerId || req.body?.peerId || null;

    if (!peerId) {
      return res.status(400).json({
        error: "peerId is required",
      });
    }

    const { markedRead, messageIds } = await Message.markThreadRead({
      listingId: req.params.listingId,
      userId: req.user.id,
      role: req.user.role,
      peerId,
    });

    emitReadReceipt(req, {
      listingId: req.params.listingId,
      readerId: req.user.id,
      peerId,
      markedRead,
      messageIds,
    });

    return res.json({
      ok: true,
      markedRead,
      messageIds,
    });
  } catch (e) {
    console.error("MESSAGES_READ_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to mark messages as read",
    });
  }
});

router.post("/:listingId/unread", async (req, res) => {
  try {
    const peerId = req.query.peerId || req.body?.peerId || null;

    if (!peerId) {
      return res.status(400).json({
        error: "peerId is required",
      });
    }

    const { markedUnread } = await Message.markThreadUnread({
      listingId: req.params.listingId,
      userId: req.user.id,
      role: req.user.role,
      peerId,
    });

    return res.json({
      ok: true,
      markedUnread,
    });
  } catch (e) {
    console.error("MESSAGES_UNREAD_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to mark messages as unread",
    });
  }
});

router.get("/:listingId", async (req, res) => {
  try {
    const peerId = req.query.peerId || null;

    if (!peerId) {
      return res.status(400).json({
        error: "peerId is required",
      });
    }

    const autoRead = req.query.autoRead !== "0";

    const { messages, markedRead, messageIds, previouslyUnreadIds, settings } =
      await Message.getThread({
        listingId: req.params.listingId,
        userId: req.user.id,
        role: req.user.role,
        peerId,
        autoRead,
      });

    emitReadReceipt(req, {
      listingId: req.params.listingId,
      readerId: req.user.id,
      peerId,
      markedRead,
      messageIds,
    });

    return res.json({ messages, previouslyUnreadIds, settings });
  } catch (e) {
    if (e?.message === "USER_BLOCKED") {
      return res.status(403).json({
        error: "User is blocked",
        code: "USER_BLOCKED",
      });
    }

    console.error("MESSAGES_THREAD_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load messages",
    });
  }
});

router.post("/:listingId", messageSendLimiter, async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    const attachmentUrl = String(req.body?.attachmentUrl || "").trim();

    if (!text && !attachmentUrl) {
      return res.status(400).json({
        error: "Message text or attachment is required",
      });
    }

    if (text.length > 2000) {
      return res.status(400).json({
        error: "Message is too long",
      });
    }

    if (attachmentUrl && !isAllowedMediaUrl(attachmentUrl)) {
      return res.status(400).json({
        error: "Attachment must be uploaded through Oriyon",
      });
    }

    const created = await Message.create({
      listingId: req.params.listingId,
      senderId: req.user.id,
      receiverId: req.body?.receiverId || null,
      text,
      attachmentUrl,
    });

    const msg = (await Message.findById(created.id)) || created;
    const io = req.app.get("io");

    if (io) {
      emitNewMessage(io, msg);
    }

    return res.status(201).json(msg);
  } catch (e) {
    if (e?.message === "LISTING_NOT_FOUND") {
      return res.status(404).json({
        error: "Listing not found",
      });
    }

    if (e?.message === "CANNOT_MESSAGE_YOURSELF") {
      return res.status(400).json({
        error: "You cannot message yourself",
      });
    }

    if (e?.message === "RECEIVER_REQUIRED") {
      return res.status(400).json({
        error: "Укажите получателя сообщения",
      });
    }

    if (e?.message === "USER_BLOCKED") {
      return res.status(403).json({
        error: "User is blocked",
        code: "USER_BLOCKED",
      });
    }

    console.error("MESSAGE_CREATE_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to send message",
    });
  }
});

module.exports = router;
