const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: "public/images",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const uploadImage = multer({
  storage: storage,
}).single("image");

module.exports = uploadImage;
