const router = require("express").Router();
const multer = require("multer");
const sharp = require("sharp");
const { v2: cloudinary } = require("cloudinary");
const auth = require("../middleware/auth");
const { MAX_LISTING_PHOTO_LIMIT } = require("../lib/listingPhotoLimits");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: MAX_LISTING_PHOTO_LIMIT,
  },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images are allowed"));
    }

    cb(null, true);
  },
});

function getModerationKind() {
  const value = String(process.env.CLOUDINARY_MODERATION || "").trim();
  return value || null;
}

function uploadToCloudinary(buffer) {
  const moderation = getModerationKind();

  return new Promise((resolve, reject) => {
    const options = {
      folder: "oriyon/listings",
      resource_type: "image",
      format: "webp",
    };

    if (moderation) {
      options.moderation = moderation;
    }

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    stream.end(buffer);
  });
}

function isModerationRejected(result) {
  const entries = Array.isArray(result?.moderation) ? result.moderation : [];

  return entries.some((entry) => {
    const status = String(entry?.status || "").toLowerCase();
    return status === "rejected";
  });
}

router.post("/images", auth, upload.array("images", MAX_LISTING_PHOTO_LIMIT), async (req, res) => {
  try {
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({
        error: "No images uploaded",
      });
    }

    const urls = [];
    const rejected = [];

    for (const file of files) {
      const optimizedBuffer = await sharp(file.buffer)
        .rotate()
        .resize({
          width: 1600,
          withoutEnlargement: true,
        })
        .webp({
          quality: 82,
        })
        .toBuffer();

      const uploaded = await uploadToCloudinary(optimizedBuffer);

      if (isModerationRejected(uploaded)) {
        rejected.push(file.originalname || "image");
        continue;
      }

      urls.push(uploaded.secure_url);
    }

    if (!urls.length) {
      return res.status(400).json({
        error:
          rejected.length > 0
            ? "Изображение не прошло автоматическую проверку"
            : "Image upload failed",
        rejected,
      });
    }

    return res.status(201).json({
      urls,
      rejected,
    });
  } catch (e) {
    console.error("UPLOAD_IMAGES_ERROR:", e);

    return res.status(500).json({
      error: e?.message || "Image upload failed",
    });
  }
});

module.exports = router;
