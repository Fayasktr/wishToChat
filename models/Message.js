const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatUser', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatUser', required: true },
    content: { type: String },
    type: { type: String, enum: ['text', 'audio'], default: 'text' },
    mediaUrl: { type: String },
    status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChatUser' }],
    deletedGlobally: { type: Boolean, default: false },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
