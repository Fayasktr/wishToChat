const express = require('express');
const router = express.Router();
const { pingWebsite } = require('../services/pinger.service');

router.get('/pinger', async (req, res) => {
    // Basic security check for Vercel Cron
    const authHeader = req.headers['authorization'];
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn('[CRON] Unauthorized attempt to trigger pinger');
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    console.log('[CRON] Pinger triggered');
    try {
        await pingWebsite();
        res.status(200).json({ success: true, message: 'Ping completed' });
    } catch (error) {
        console.error('[CRON] Pinger failed:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
