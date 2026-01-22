const Settings = require('../models/Settings');

exports.getLogin = (req, res) => res.render('user/login', { title: 'Secret Code' });

exports.postLogin = async (req, res) => {
    const { code } = req.body;

    // Fayas Admin Login
    if (code === process.env.ADMIN_CODE) {
        req.session.user = 'fayas';
        req.session.authenticated = true;
        return req.session.save(() => {
            res.redirect('/admin');
        });
    }

    // Safeena Login
    try {
        const settings = await Settings.findOne();
        if (settings && code === settings.secretCode) {
            req.session.user = 'safeena';
            req.session.authenticated = true;
            return req.session.save(() => {
                res.redirect('/birthday');
            });
        }
    } catch (err) {
        console.error(err);
    }

    res.render('user/login', { error: 'Incorrect code, my love ❤️', title: 'Secret Code' });
};

exports.getBirthday = (req, res) => res.render('user/birthday', { title: 'A Special Message' });
exports.getLanding = (req, res) => res.render('user/landing', { title: 'Happy Birthday!' });
// exports.getStory = (req, res) => res.render('user/story', { title: 'Our Story' }); // Removed story page
exports.getGallery = (req, res) => res.render('user/gallery', { title: 'Memories' });
exports.getSurprise = (req, res) => res.render('user/surprise', { title: 'Surprise!' });
exports.getWish = (req, res) => res.render('user/wish', { title: 'The Big Wish' });
exports.getLetter = (req, res) => res.render('user/letter', { title: 'I want to say to you..' });
exports.getChat = (req, res) => {
    res.render('user/chat', {
        title: 'Whisper to me',
        currentUser: req.session.user // 'safeena' or 'fayas'
    });
};
