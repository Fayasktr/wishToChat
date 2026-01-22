const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    secretCode: {
        type: String,
        default: '2026'
    },
    musicUrl: {
        type: String,
        default: 'https://youtu.be/JpK7AY0Rj5U?si=11Ze4nzwosuBAdAW'
    },
    themeColor: {
        type: String,
        default: '#ffb6c1'
    }
});

module.exports = mongoose.model('Settings', settingsSchema);
