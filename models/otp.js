const { Schema, model } = require("mongoose");

const OtpSchema = new Schema({
  userid: String,
  otp: Number,
});

const Otp = model("user", OtpSchema);

module.exports = Otp;
