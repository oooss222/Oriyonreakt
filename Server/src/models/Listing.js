const { Schema, model, Types } = require("mongoose");

const imageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, default: "" },
  },
  { _id: false }
);

const listingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    price: { type: String, default: "" }, // можно хранить строкой "155 000 TJS"
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    cat: { type: String, required: true, trim: true }, // например: 'transport'
    images: { type: [imageSchema], default: [] },
    owner: { type: Types.ObjectId, ref: "User", required: true }, // владелец
  },
  { timestamps: true }
);

module.exports = model("Listing", listingSchema);
