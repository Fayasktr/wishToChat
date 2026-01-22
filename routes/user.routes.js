const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

const authMiddleware = (req, res, next) => {
    if (req.session.authenticated) return next();
    res.redirect('/login');
};

router.get('/login', userController.getLogin);
router.post('/login', userController.postLogin);

router.get('/birthday', authMiddleware, userController.getBirthday);
router.get('/landing', authMiddleware, userController.getLanding);

router.get('/gallery', authMiddleware, userController.getGallery);
router.get('/surprise', authMiddleware, userController.getSurprise);
router.get('/wish', authMiddleware, userController.getWish);

router.get('/letter', authMiddleware, userController.getLetter);
router.get('/chat', authMiddleware, userController.getChat);
router.get('/', (req, res) => res.redirect('/login'));

module.exports = router;
