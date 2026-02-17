const cron = require('node-cron');
const axios = require('axios');
const CronLog = require('../models/CronLog');
const Settings = require('../models/Settings');

const TARGET_URL = 'https://zoho-notes.onrender.com/';

const pingWebsite = async () => {
    try {
        const settings = await Settings.findOne();
        if (settings && settings.pingerEnabled === false) {
            // console.log('[PINGER] Service is currently disabled');
            return;
        }

        const start = Date.now();
        await axios.get(TARGET_URL, {
            validateStatus: function (status) {
                return status < 500;
            }
        });
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
    // Only run internal cron if not on Vercel
    if (process.env.VERCEL) {
        console.log('[PINGER] Running on Vercel, internal cron disabled.');
        return;
    }
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', () => {
        pingWebsite();
    });

};

module.exports = { initPinger, pingWebsite };
