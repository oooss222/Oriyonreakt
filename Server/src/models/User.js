const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    sellerType: {
      type: String,
      enum: ["private", "company"],
      default: "private",
    },
  },
  { timestamps: true }
);

module.exports = model("User", userSchema);
