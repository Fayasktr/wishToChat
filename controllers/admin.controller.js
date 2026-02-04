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
    try {
        const logs = await CronLog.find().sort({ timestamp: -1 });
        res.render('admin/pinger', {
            logs,
            title: 'Website Pinger',
            layout: false // Or use main layout if desired, but consistent with others
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
