const mongoose = require("mongoose");

async function connect(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { dbName: undefined }); // db в uri
  console.log("Mongo connected:", uri);
}

module.exports = { connect };
