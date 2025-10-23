const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { upload, handleUploadError } = require('../middleware/upload');
const auth = require('../middleware/auth');

// Apply authentication to all file routes
router.use(auth);

// Upload file
router.post('/upload', upload.single('file'), fileController.uploadFile, handleUploadError);

// Delete file
router.delete('/:filename', fileController.deleteFile);

// Get file info
router.get('/info/:filename', fileController.getFileInfo);

// List user files
router.get('/list', fileController.listUserFiles);

module.exports = router;
