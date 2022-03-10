require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/userModel");
const mailSender = require("../utils/mailSender");
const uploadImage = require("../utils/imageUploader");

const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const user_email = await User.findOne({ email });
    if (user_email) {
      return res
        .status(400)
        .json({ email: "This email address is already taken" });
    }
    const emailToken = jwt.sign(
      { firstName, lastName, email, password },
      process.env.EMAIL_TOKEN_SECRET,
      {
        expiresIn: "1d",
      }
    );
    const resetEmailToken = crypto.randomBytes(32).toString("hex");

    const _resetEmailToken = crypto
      .createHash("sha256")
      .update(resetEmailToken)
      .digest("hex");

    const uri = `http://localhost:3000/verify_email_address?token=${_resetEmailToken}`;

    try {
      await mailSender({
        email,
        subject: "Verify Email Address",
        html: `<div
        style="
          background-color: orange;
          padding: 5px;
          color: white;
          text-align: center;
          width: 750px;
          height:220px;
          margin: auto;
        "
      >
        <h1>MERN App</h1>
        <div style="font-size: 20px">You requested for email address verification</div>
        <div style="font-size: 20px; margin-bottom: 25px">Please click on the button given below</div>
        <a
          style="
            font-size:18px;
            padding: 10px;
            border-radius:10px;
            color: white;
            text-decoration: none;
            background-color: green;
          "
          href=${uri}
          >Verify Email Address</a
        >
      </div>`,
      });
      return res
        .status(200)
        .json({ message: "Email sent successfully", emailToken });
    } catch (err) {
      return res.status(400).json({
        error:
          "There was an error in sending the email, Please try again later.",
        err,
      });
    }
  } catch (err) {
    res.status(400).json(err);
  }
};

const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ invalidCreds: "Invalid credentials!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ invalidCreds: "Invalid credentials!" });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(200).json({
      token,
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImage: user.profileImage,
    });
  } catch (err) {
    res.status(400).json(err);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ email: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.expireToken = Date.now() + 900000;

    await user.save();
    const uri = `http://localhost:3000/reset_password?token=${resetToken}`;
    try {
      await mailSender({
        email: user.email,
        subject: "Reset Password",
        html: `<div
             style="
               background-color: orange;
               padding: 5px;
               color: white;
               text-align: center;
               width: 750px;
               height:220px;
               margin: auto;
             "
           >
             <h1>MERN App</h1>
             <div style="font-size: 20px">You requested for reset password</div>
             <div style="font-size: 20px; margin-bottom: 25px">Please click on the button given below</div>
             <a
               style="
                 font-size:18px;
                 padding: 10px;
                 border-radius:10px;
                 color: white;
                 text-decoration: none;
                 background-color: green;
               "
               href=${uri}
               >Reset Password</a
             >
           </div>`,
      });
      return res.status(200).json({
        message: "Email sent successfully",
        resetToken: user.resetToken,
        expireToken: user.expireToken,
      });
    } catch (err) {
      user.resetToken = undefined;
      user.expireToken = undefined;
      await user.save();
      return res.status(400).json({
        error:
          "There was an error in sending the email, Please try again later.",
        err,
      });
    }
  } catch (err) {
    res.status(400).json(err);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token) {
      return res.status(400).json({
        sessionExpired: "Session has been expired, Please try again later.",
      });
    }
    const user = await User.findOne({
      resetToken: token,
      expireToken: { $gte: Date.now() },
    });
    if (user) {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedPassword;
      user.resetToken = undefined;
      user.expireToken = undefined;
      await user.save();
      return res.status(200).json({ message: "Password reset successfully" });
    }
    return res
      .status(400)
      .json({ error: "Something went wrong, please try again later." });
  } catch (err) {
    res.status(400).json(err);
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (oldPassword === newPassword) {
      return res.status(400).json({
        newPassword: "Old Password and New Password should not be the same",
      });
    }
    const user = await User.findById(req.user._id);
    if (user) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ oldPassword: "Old password is not correct" });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            password: hashedPassword,
          },
        },
        {
          new: true,
        }
      );
      return res.status(201).json({
        message: "Password changed successfully",
        email: user.email,
      });
    }
    return res
      .status(400)
      .json({ error: "Something went wrong, please try again later." });
  } catch (err) {
    res.status(400).json(err);
  }
};

const verifyEmailAddress = async (req, res) => {
  const { token } = req.body;
  if (token) {
    jwt.verify(token, process.env.EMAIL_TOKEN_SECRET, (err, decodedToken) => {
      if (err) {
        return res.status(400).json({
          sessionExpired: "Session has been expired, Please try again later.",
        });
      }
      const { firstName, lastName, email, password } = decodedToken;
      bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
          });
          user.save((err, success) => {
            if (err) {
              return res.status(400).json(
                {
                  error: "Something went wrong, please try again later.",
                },
                err
              );
            }
            if (success) {
              return res.status(201).json(user);
            }
          });
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    });
  }
};

const changeProfileImage = async (req, res) => {
  try {
    uploadImage(req, res, (err) => {
      if (err) {
        return res.status(400).json(err);
      } else if (req.file === undefined) {
        return res.status(400).json({ noFile: "No file selected" });
      }
      User.findByIdAndUpdate(
        { _id: req.user._id },
        {
          $set: {
            profileImage: req.file.filename,
          },
        },
        { new: true }
      )
        .then((user) => {
          return res.status(201).json({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profileImage: user.profileImage,
          });
        })
        .catch((err) => {
          return res.status(400).json({
            error: "Something went wrong, please try again later.",
            err,
          });
        });
    });
  } catch (err) {
    res.status(400).json(err);
  }
};

const editProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const user = await User.findByIdAndUpdate(
      { _id: req.user._id },
      {
        $set: { firstName, lastName },
      },
      { new: true }
    );
    return res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImage: user.profileImage,
    });
  } catch (err) {
    res.status(400).json(err);
  }
};

module.exports = {
  signup,
  signin,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmailAddress,
  changeProfileImage,
  editProfile,
};
