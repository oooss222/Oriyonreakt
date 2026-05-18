const router = require("express").Router();
const multer = require("multer");
const sharp = require("sharp");
const { v2: cloudinary } = require("cloudinary");
const auth = require("../middleware/auth");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "oriyon/listings",
        resource_type: "image",
        format: "webp",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

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

      urls.push(uploaded.secure_url);
    }

    return res.status(201).json({
      urls,
    });
  } catch (e) {
    console.error("UPLOAD_IMAGES_ERROR:", e);

    return res.status(500).json({
      error: e?.message || "Image upload failed",
    });
  }
});

module.exports = router;