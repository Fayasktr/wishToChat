const mongoose = require('mongoose');

const CronLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['Success', 'Failed'], required: true },
    responseTime: { type: Number, required: true },
    message: { type: String }
}, {
    capped: { size: 102400, max: 100 } // Max 100 logs
});

module.exports = mongoose.model('CronLog', CronLogSchema);
