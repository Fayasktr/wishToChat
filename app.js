const express = require('express');
require('dotenv').config();
const hbs = require('hbs');
const session = require('express-session');
const path = require('path');
const mongoose = require('mongoose');
const Settings = require('./models/Settings');
const fs = require('fs');
const http = require('http');
const socketIO = require('socket.io');

const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');
const chatRoutes = require('./routes/chat.routes');
const seedChatUsers = require('./seedChatUsers');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: { origin: "*" }
});

const PORT = process.env.PORT || 3050;

// View engine setup
app.engine('hbs', hbs.__express);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// HBS Helpers
hbs.registerHelper('eq', function (a, b) {
    return a === b;
});

hbs.registerHelper('formatDate', function (date) {
    if (!date) return '';
    return new Date(date).toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
});

hbs.registerHelper('add', function (a, b) {
    return a + b;
});

// Middleware
app.use(express.json()); // For chat API
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/newWork', express.static(path.join(__dirname, 'newWork')));
app.use('/sayYes', express.static(path.join(__dirname, 'sayYes')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key',
    resave: false,
    saveUninitialized: true
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/safeenaBirthday').then(async () => {
    console.log('Connected to MongoDB');
    await initDB();
    await seedChatUsers();
}).catch(err => console.log(err));

async function initDB() {
    try {
        const count = await Settings.countDocuments();
        if (count === 0) {
            let initialSettings = {};
            try {
                if (fs.existsSync(path.join(__dirname, 'data/settings.json'))) {
                    const fileData = fs.readFileSync(path.join(__dirname, 'data/settings.json'));
                    initialSettings = JSON.parse(fileData);
                }
            } catch (e) {
                console.log('No settings.json found, using defaults.');
            }

            await Settings.create({
                secretCode: initialSettings.secretCode || '2026',
                musicUrl: initialSettings.musicUrl,
                themeColor: initialSettings.themeColor
            });
            console.log('Database seeded with initial settings');
        }
    } catch (err) {
        console.error('DB Init Error:', err);
    }
}

// Routes
app.use('/admin', adminRoutes);
app.use('/chat-api', chatRoutes);
app.use('/', userRoutes);

// Socket Logic
require('./socket/chat.socket')(io);

// Pinger Service
const { initPinger } = require('./services/pinger.service');
initPinger();

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
