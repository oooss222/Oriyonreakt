const router = require("express").Router();

const auth = require("../middleware/auth");
const Message = require("../models/Message");

router.use(auth);

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

router.get("/:listingId", async (req, res) => {
  try {
    const data = await Message.getThread({
      listingId: req.params.listingId,
      userId: req.user.id,
      role: req.user.role,
    });

    return res.json(data);
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

    const msg = await Message.create({
      listingId: req.params.listingId,
      senderId: req.user.id,
      text,
    });

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

    console.error("MESSAGE_CREATE_ERROR:", e?.message);

    return res.status(500).json({
      error: "Failed to send message",
    });
  }
});

module.exports = router;