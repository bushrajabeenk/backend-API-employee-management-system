const { Schema, model } = require("mongoose");

const UserSchema = new Schema({
  name: { type: String, unique: true },
  username: String,
  hash: String,
  // otp: String,
  email: { type: String, unique: true },
  role: {
    type: String,
    enum: ["HR", "Employee", "Guests"],
  },
});

const User = model("user", UserSchema);

module.exports = User;
