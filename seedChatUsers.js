const ChatUser = require('./models/ChatUser');
const bcrypt = require('bcryptjs');

async function seedUsers() {
    const users = [
        {
            email: process.env.CHAT_USER1_EMAIL,
            password: process.env.CHAT_USER1_PASSWORD,
            name: process.env.CHAT_USER1_NAME
        },
        {
            email: process.env.CHAT_USER2_EMAIL,
            password: process.env.CHAT_USER2_PASSWORD,
            name: process.env.CHAT_USER2_NAME
        }
    ];

    for (const u of users) {
        if (!u.email) continue; // Skip if env vars aren't set

        const exists = await ChatUser.findOne({ email: u.email });
        const hashedPassword = await bcrypt.hash(u.password, 10);

        if (!exists) {
            await ChatUser.create({ ...u, password: hashedPassword });
            console.log(`User seeded: ${u.name}`);
        } else {
            // Update password to match .env
            exists.password = hashedPassword;
            exists.name = u.name;
            await exists.save();
            console.log(`User updated: ${u.name}`);
        }
    }
}

module.exports = seedUsers;
