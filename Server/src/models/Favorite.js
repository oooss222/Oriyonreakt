const { Schema, model, Types } = require("mongoose");

const favoriteSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    listingId: {
      type: Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// один и тот же товар нельзя добавить в избранное дважды
favoriteSchema.index({ userId: 1, listingId: 1 }, { unique: true });

module.exports = model("Favorite", favoriteSchema);
