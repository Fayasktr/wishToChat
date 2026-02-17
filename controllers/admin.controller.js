const Settings = require('../models/Settings');
const path = require('path');
const fs = require('fs');

exports.getDashboard = async (req, res) => {
    const appSettings = await Settings.findOne();
    res.render('admin/dashboard', { appSettings, title: 'Admin' });
};

exports.updateSettings = async (req, res) => {
    try {
        await Settings.findOneAndUpdate({}, {
            secretCode: req.body.secretCode,
            musicUrl: req.body.musicUrl,
            themeColor: req.body.themeColor
        }, { upsert: true });
    } catch (err) {
        console.error(err);
    }
    res.redirect('/admin');
};

exports.uploadGallery = (req, res) => {
    res.redirect('/admin');
};

exports.uploadWishMedia = (req, res) => {
    res.redirect('/admin');
};

exports.getPinger = async (req, res) => {
    const CronLog = require('../models/CronLog');
    const Settings = require('../models/Settings');
    try {
        const logs = await CronLog.find().sort({ timestamp: -1 }).limit(50);
        const appSettings = await Settings.findOne();
        res.render('admin/pinger', {
            logs,
            appSettings,
            title: 'Website Pinger',
            layout: false
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.togglePinger = async (req, res) => {
    try {
        const settings = await Settings.findOne();
        const newState = !settings.pingerEnabled;
        await Settings.findOneAndUpdate({}, { pingerEnabled: newState }, { upsert: true });
        res.json({ success: true, pingerEnabled: newState });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
