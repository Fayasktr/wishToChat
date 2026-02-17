const express = require('express');
const router = express.Router();
const { pingWebsite } = require('../services/pinger.service');

router.get('/pinger', async (req, res) => {
    // Basic security check for Vercel Cron
    // In production, Vercel sends a CRON_SECRET or specific header
    // But for a simple ping, we can just allow it or check a secret
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
