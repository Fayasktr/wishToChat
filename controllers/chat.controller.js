const ChatUser = require('../models/ChatUser');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await ChatUser.findOne({ email });
        if (!user) return res.status(401).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { _id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const messages = await Message.find({
            deletedGlobally: false,
            deletedFor: { $ne: req.user.userId }
        }).sort({ timestamp: 1 }).populate('senderId', 'name');
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.uploadAudio = (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/chat_audio/${req.file.filename}`;
    res.json({ url });
};

exports.deleteMessage = async (req, res) => {
    const { messageId, type } = req.body; // type: 'self' or 'both'
    try {
        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ error: 'Message not found' });

        if (type === 'self') {
            message.deletedFor.push(req.user.userId);
        } else if (type === 'both') {
            // Check if sender is the one deleting
            if (message.senderId.toString() !== req.user.userId) {
                return res.status(403).json({ error: 'Only sender can delete for everyone' });
            }
            message.deletedGlobally = true;
        }
        await message.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getPartner = async (req, res) => {
    try {
        const partner = await ChatUser.findOne({ _id: { $ne: req.user.userId } });
        res.json(partner);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteAllMessages = async (req, res) => {
    const { type } = req.body; // 'self' or 'both'
    try {
        if (type === 'self') {
            // For messages not already deleted for me, add me to deletedFor
            await Message.updateMany(
                { deletedFor: { $ne: req.user.userId }, deletedGlobally: false },
                { $push: { deletedFor: req.user.userId } }
            );
        } else if (type === 'both') {
            // Check if current user is Fayas (only Fayas can delete all for both)
            const user = await ChatUser.findById(req.user.userId);
            if (user.name.toLowerCase() !== 'fayas') {
                return res.status(403).json({ error: 'Only Fayas can clear chat for both' });
            }
            await Message.updateMany({}, { deletedGlobally: true });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
