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
