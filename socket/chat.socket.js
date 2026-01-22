const Message = require('../models/Message');
const ChatUser = require('../models/ChatUser');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Auth error'));
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        } catch (err) {
            next(new Error('Auth error'));
        }
    });

    io.on('connection', async (socket) => {
        console.log('User connected to chat:', socket.userId);

        // Update user status
        await ChatUser.findByIdAndUpdate(socket.userId, { socketId: socket.id });

        socket.join('couple_room');

        // On connect, mark all messages sent TO this user as 'delivered'
        await Message.updateMany(
            { receiverId: socket.userId, status: 'sent' },
            { status: 'delivered' }
        );
        io.to('couple_room').emit('statusUpdate', { receiverId: socket.userId, status: 'delivered' });

        socket.on('sendMessage', async (data) => {
            const { receiverId, content, type, mediaUrl, replyTo } = data;

            const message = new Message({
                senderId: socket.userId,
                receiverId,
                content,
                type,
                mediaUrl,
                replyTo,
                status: 'sent'
            });

            // Check if receiver is online
            const receiver = await ChatUser.findById(receiverId);
            if (receiver.socketId) {
                message.status = 'delivered';
            }

            await message.save();
            await message.populate('replyTo');

            // Broadcast to the room
            io.to('couple_room').emit('message', message);
        });

        socket.on('markSeen', async (data) => {
            const { senderId } = data; // Mark messages from this sender as seen
            await Message.updateMany(
                { senderId: senderId, receiverId: socket.userId, status: { $ne: 'seen' } },
                { status: 'seen' }
            );
            io.to('couple_room').emit('statusUpdate', { receiverId: socket.userId, senderId: senderId, status: 'seen' });
        });

        socket.on('typing', (data) => {
            socket.to('couple_room').emit('typing', { userId: socket.userId, isTyping: data.isTyping });
        });

        socket.on('disconnect', async () => {
            await ChatUser.findByIdAndUpdate(socket.userId, { socketId: null, lastSeen: new Date() });
            console.log('User disconnected from chat');
        });
    });
};
