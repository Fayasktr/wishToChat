const mongoose = require('mongoose');

const ChatUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    socketId: { type: String, default: null },
    lastSeen: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatUser', ChatUserSchema);
