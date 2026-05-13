const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const sharp = require("sharp");
const auth = require("../middleware/auth");

const uploadDir = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images are allowed"));
    }

    cb(null, true);
  },
});

router.post("/images", auth, upload.array("images", 10), async (req, res) => {
  try {
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({
        error: "No images uploaded",
      });
    }

    const urls = [];

    for (const file of files) {
      const filename = `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}.webp`;

      const outputPath = path.join(uploadDir, filename);

      await sharp(file.buffer)
        .rotate()
        .resize({
          width: 1600,
          withoutEnlargement: true,
        })
        .webp({
          quality: 82,
        })
        .toFile(outputPath);

      urls.push(`/uploads/${filename}`);
    }

    return res.status(201).json({
      urls,
    });
  } catch (e) {
    console.error("UPLOAD_IMAGES_ERROR:", e?.message);

    return res.status(500).json({
      error: "Image upload failed",
    });
  }
});

module.exports = router;