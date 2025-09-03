// multerConfig.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/excel/'); // Folder to save uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Save file with original name
  }
});

const upload = multer({ storage });

module.exports = upload;
