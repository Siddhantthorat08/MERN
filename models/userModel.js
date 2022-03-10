const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default:
        "https://res.cloudinary.com/djclqis21/image/upload/v1626947554/empty-pic_ghlmq7.jpg",
    },
    resetToken: String,
    expireToken: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
