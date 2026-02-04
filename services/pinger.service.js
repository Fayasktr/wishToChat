const cron = require('node-cron');
const axios = require('axios');
const CronLog = require('../models/CronLog');

const TARGET_URL = 'https://zoho-notes.onrender.com/';

const pingWebsite = async () => {
    const start = Date.now();
    try {
        await axios.get(TARGET_URL);
        const duration = Date.now() - start;

        await CronLog.create({
            status: 'Success',
            responseTime: duration,
            message: 'Ping successful'
        });
        console.log(`[PINGER] Success: ${duration}ms`);
    } catch (error) {
        const duration = Date.now() - start;
        await CronLog.create({
            status: 'Failed',
            responseTime: duration,
            message: error.message || 'Unknown error'
        });
        console.error(`[PINGER] Failed: ${error.message}`);
    }
};

const initPinger = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', () => {
        console.log('[PINGER] Starting scheduled ping...');
        pingWebsite();
    });

    console.log('[PINGER] Service initialized (Interval: 5 mins)');
};

module.exports = { initPinger };
