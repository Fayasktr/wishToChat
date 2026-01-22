try {
    console.log('Checking modules...');
    require('express'); console.log('express ok');
    require('dotenv'); console.log('dotenv ok');
    require('hbs'); console.log('hbs ok');
    require('express-session'); console.log('express-session ok');
    require('mongoose'); console.log('mongoose ok');
    require('multer'); console.log('multer ok');

    console.log('Checking local files...');
    require('./models/Settings'); console.log('Settings ok');
    require('./controllers/admin.controller'); console.log('admin.controller ok');
    require('./controllers/user.controller'); console.log('user.controller ok');
    require('./routes/admin.routes'); console.log('admin.routes ok');
    require('./routes/user.routes'); console.log('user.routes ok');
} catch (e) {
    console.error('ERROR:', e.message);
    console.error('CODE:', e.code);
    console.error('STACK:', e.stack);
}
