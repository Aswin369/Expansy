const mongoose = require("mongoose")
const {Schema} = mongoose;

const userSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: false,
      },
      email: {
        type: String,
        required: false,
        unique: true,
      },
      phone: {
        type: String,
        required: false,
        unique: false,
        sparse: true,
        default: null,
      },
      googleId: {
        type: String,
        unique: true,
      },
      password: {
        type: String,
        required: false,
      },
      isBlocked: {
        type: Boolean,
        default: false,
      },
      isAdmin: {
        type: Boolean,
        default: false,
      },
      wallet: {
        type: Number,
        default: 0, 
      },
      referralCode: {
        type: String,
        unique: true,
        required: true,
        default: function () {
          return Math.random().toString(36).substr(2, 8).toUpperCase(); 
        },
      },
      referredBy: {
        type: String,
        ref: "User",
        default: null,
      },
    },
    { timestamps: true }
  );

const User = mongoose.model("User",userSchema)

module.exports = User
