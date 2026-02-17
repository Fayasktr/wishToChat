const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const multer = require('multer');

// Configure Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (req.path.includes('app-gallery')) {
            cb(null, 'public/uploads');
        } else if (req.path.includes('wish-media')) {
            if (file.mimetype.startsWith('audio')) {
                cb(null, 'newWork/assets/audio');
            } else {
                cb(null, 'newWork/assets/images');
            }
        }
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

const adminAuth = (req, res, next) => {
    // console.log('Admin Auth Check:', req.session); // Debugging
    if (req.session && req.session.authenticated && (req.session.user === 'fayas' || req.session.user === 'ping')) {
        return next();
    }
    res.redirect('/login');
};

router.get('/', adminAuth, adminController.getDashboard);
router.get('/pinger', adminAuth, adminController.getPinger);
router.post('/pinger/toggle', adminAuth, adminController.togglePinger);
router.post('/update', adminAuth, adminController.updateSettings);
router.post('/upload/app-gallery', adminAuth, upload.array('galleryImages'), adminController.uploadGallery);
router.post('/upload/wish-media', adminAuth, upload.fields([{ name: 'wishAudio', maxCount: 1 }, { name: 'wishImages', maxCount: 10 }]), adminController.uploadWishMedia);

module.exports = router;
