const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Helper function to get user from token (same as in publicationController)
const getUserFromToken = (req) => {
  const token = req.cookies?.token;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Upload file controller
exports.uploadFile = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get backend URL from environment or construct it
    const protocol = req.secure ? 'https' : 'http';
    const host = req.get('host') || 'localhost:4000';
    const backendUrl = `${protocol}://${host}`;

    // Get file information
    const fileInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadPath: req.file.path,
      relativePath: path.relative(process.cwd(), req.file.path),
      url: `${backendUrl}/uploads/${path.relative('uploads', req.file.path).replace(/\\/g, '/')}`,
      uploadedBy: {
        id: user._id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
      },
      uploadedAt: new Date()
    };

    console.log('File uploaded successfully:', fileInfo.filename);
    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileInfo
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
};

// Delete file controller
exports.deleteFile = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { filename } = req.params;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // Construct file path - try multiple possible locations
    const possiblePaths = [
      path.join('uploads', 'pdfs', user._id.toString(), filename),
      path.join('uploads', 'documents', user._id.toString(), filename),
      path.join('uploads', user._id.toString(), filename)
    ];

    let filePath = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        filePath = possiblePath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    console.log('File deleted successfully:', filename);
    res.json({
      message: 'File deleted successfully',
      deletedFile: filename
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'File deletion failed' });
  }
};

// Get file info
exports.getFileInfo = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { filename } = req.params;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // Construct file path - try multiple possible locations
    const possiblePaths = [
      path.join('uploads', 'pdfs', user._id.toString(), filename),
      path.join('uploads', 'documents', user._id.toString(), filename),
      path.join('uploads', user._id.toString(), filename)
    ];

    let filePath = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        filePath = possiblePath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get backend URL from environment or construct it
    const protocol = req.secure ? 'https' : 'http';
    const host = req.get('host') || 'localhost:4000';
    const backendUrl = `${protocol}://${host}`;

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileInfo = {
      filename: filename,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      url: `${backendUrl}/uploads/${path.relative('uploads', filePath).replace(/\\/g, '/')}`
    };

    res.json(fileInfo);

  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({ error: 'Failed to get file information' });
  }
};

// List user files
exports.listUserFiles = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get backend URL from environment or construct it
    const protocol = req.secure ? 'https' : 'http';
    const host = req.get('host') || 'localhost:4000';
    const backendUrl = `${protocol}://${host}`;

    const allFiles = [];

    // Search in all possible upload directories
    const possibleDirs = [
      path.join('uploads', 'pdfs', user._id.toString()),
      path.join('uploads', 'documents', user._id.toString()),
      path.join('uploads', user._id.toString())
    ];

    possibleDirs.forEach(userDir => {
      if (fs.existsSync(userDir)) {
        const files = fs.readdirSync(userDir);
        files.forEach(filename => {
          const filePath = path.join(userDir, filename);
          const stats = fs.statSync(filePath);
          const relativePath = path.relative('uploads', filePath).replace(/\\/g, '/');

          allFiles.push({
            filename: filename,
            originalName: filename.split('-').slice(0, -1).join('-').replace(/_/g, ' '),
            size: stats.size,
            createdAt: stats.birthtime,
            url: `${backendUrl}/uploads/${relativePath}`,
            type: path.extname(filename).toLowerCase()
          });
        });
      }
    });

    // Sort by creation date (newest first)
    allFiles.sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      files: allFiles,
      total: allFiles.length,
      user: user._id
    });

  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
};
