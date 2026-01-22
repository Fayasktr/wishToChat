const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Auth middleware
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// Rate limiter: Max 3 requests, block for 30s
const loginLimiter = rateLimit({
    windowMs: 30 * 1000,
    max: 3,
    message: { error: 'Too many requests, please try again in 30 seconds' }
});

// Multer for audio
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/chat_audio/'),
    filename: (req, file, cb) => cb(null, `audio_${Date.now()}.webm`)
});
const upload = multer({ storage });

router.post('/login', loginLimiter, chatController.login);
router.get('/history', auth, chatController.getHistory);
router.get('/partner', auth, chatController.getPartner);
router.post('/upload-audio', auth, upload.single('audio'), chatController.uploadAudio);
router.post('/delete', auth, chatController.deleteMessage);
router.post('/delete-all', auth, chatController.deleteAllMessages);

module.exports = router;
