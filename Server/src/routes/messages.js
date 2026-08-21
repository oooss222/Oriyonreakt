const router = require("express").Router();

const auth = require("../middleware/auth");
const Message = require("../models/Message");
const { emitNewMessage, emitMessagesRead } = require("../socket");

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
    const data = await Message.inbox({
      userId: req.user.id,
      role: req.user.role,
    });

    return res.json(data);
  } catch (e) {
    console.error("MESSAGES_INBOX_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load inbox",
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

router.get("/:listingId", async (req, res) => {
  try {
    const peerId = req.query.peerId || null;

    if (!peerId) {
      return res.status(400).json({
        error: "peerId is required",
      });
    }

    const { messages, markedRead, messageIds, previouslyUnreadIds } =
      await Message.getThread({
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

    return res.json({ messages, previouslyUnreadIds });
  } catch (e) {
    console.error("MESSAGES_THREAD_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to load messages",
    });
  }
});

router.post("/:listingId", async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();

    if (text.length < 1) {
      return res.status(400).json({
        error: "Message text is required",
      });
    }

    if (text.length > 2000) {
      return res.status(400).json({
        error: "Message is too long",
      });
    }

    const created = await Message.create({
      listingId: req.params.listingId,
      senderId: req.user.id,
      receiverId: req.body?.receiverId || null,
      text,
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

    console.error("MESSAGE_CREATE_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to send message",
    });
  }
});

module.exports = router;
