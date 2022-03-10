const router = require("express").Router();
const { requireSignin } = require("../middlewares/requireSignin");
const {
  signup,
  signin,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmailAddress,
  changeProfileImage,
  editProfile,
} = require("../controllers/userController");

router.post("/signup", signup);

router.post("/signin", signin);

router.post("/forgot_password", forgotPassword);

router.post("/reset_password", resetPassword);

router.put("/change_password", requireSignin, changePassword);

router.post("/verify_email_address", verifyEmailAddress);

router.put("/change_profile_image", requireSignin, changeProfileImage);

router.put("/edit_profile", requireSignin, editProfile);

module.exports = router;
