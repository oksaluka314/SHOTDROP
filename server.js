const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ============================================
// DATABASE SETUP
// ============================================

let usersDB = [];
let galleriesDB = [];
let mongoConnected = false;

mongoose.set('bufferCommands', false);

// Sample data для демонстрації
galleriesDB = [
    {
        id: 'demo-1',
        code: 'ABC-123',
        name: 'Весілля Олександра',
        photographerId: 'demo-user',
        photoCount: 25,
        createdAt: new Date().toISOString()
    },
    {
        id: 'demo-2',
        code: 'XYZ-789',
        name: 'Портретна сесія',
        photographerId: 'demo-user',
        photoCount: 15,
        createdAt: new Date().toISOString()
    }
];

// ============================================
// MONGODB CONNECTION
// ============================================

if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        w: 'majority'
    })
    .then(() => {
        mongoConnected = true;
        console.log('✅ MongoDB Atlas підключена успішно!');
    })
    .catch(err => {
        mongoConnected = false;
        console.log('⚠️ MongoDB недоступна, використовується локальна база:', err.message);
    });

    // Define Mongoose Schemas
    const userSchema = new mongoose.Schema({
        email: { type: String, unique: true, required: true },
        password: String,
        role: String,
        createdAt: { type: Date, default: Date.now }
    });

    const gallerySchema = new mongoose.Schema({
        code: { type: String, unique: true, required: true },
        name: String,
        photographerId: String,
        photoCount: Number,
        selectedPhotos: Number,
        createdAt: { type: Date, default: Date.now }
    });

    const User = mongoose.model('User', userSchema);
    const Gallery = mongoose.model('Gallery', gallerySchema);

    global.User = User;
    global.Gallery = Gallery;

    mongoose.connection.on('connected', () => {
        mongoConnected = true;
    });

    mongoose.connection.on('disconnected', () => {
        mongoConnected = false;
        console.log('MongoDB disconnected, switching to In-Memory data');
    });

    mongoose.connection.on('error', (err) => {
        mongoConnected = false;
        console.log('MongoDB connection error:', err.message);
    });
} else {
    console.log('📝 Локальна база даних (In-Memory)');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateGalleryId() {
    return 'gallery_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateAccessCode() {
    const part1 = Math.random().toString(36).substr(2, 3).toUpperCase();
    const part2 = Math.random().toString(36).substr(2, 3).toUpperCase();
    const part3 = Math.floor(Math.random() * 1000);
    return `${part1}-${part2}-${part3}`;
}

function isMongoUserReady() {
    return mongoConnected && mongoose.connection.readyState === 1 && global.User;
}

function isMongoGalleryReady() {
    return mongoConnected && mongoose.connection.readyState === 1 && global.Gallery;
}

// ============================================
// API ROUTES
// ============================================

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: '🚀 Сервер працює',
        database: 'In-Memory (локальна)',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// AUTH ROUTES
// ============================================

// Реєстрація
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (isMongoUserReady()) {
            // MongoDB
            const existingUser = await global.User.findOne({ email });
            if (existingUser) {
                return res.json({ success: false, error: 'Цей email вже зареєстрований' });
            }
            const newUser = new global.User({ email, password, role: role || 'photographer' });
            await newUser.save();
            res.json({ success: true, userId: newUser._id });
        } else {
            // In-Memory
            const existingUser = usersDB.find(u => u.email === email);
            if (existingUser) {
                return res.json({ success: false, error: 'Цей email вже зареєстрований' });
            }
            const newUser = {
                id: generateUserId(),
                email,
                password,
                role: role || 'photographer',
                createdAt: new Date().toISOString()
            };
            usersDB.push(newUser);
            res.json({ success: true, userId: newUser.id });
        }
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// Вхід
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (isMongoUserReady()) {
            // MongoDB
            const user = await global.User.findOne({ email, password });
            if (user) {
                res.json({ success: true, userId: user._id, role: user.role });
            } else {
                res.json({ success: false, error: 'Невірні дані входу' });
            }
        } else {
            // In-Memory
            const user = usersDB.find(u => u.email === email && u.password === password);
            if (user) {
                res.json({ success: true, userId: user.id, role: user.role });
            } else {
                res.json({ success: false, error: 'Невірні дані входу' });
            }
        }
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// Change password / forgot password
app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ success: false, error: 'Вкажіть email і новий пароль' });
        }

        if (password.length < 6) {
            return res.json({ success: false, error: 'Пароль повинен мати мінімум 6 символів' });
        }

        if (isMongoUserReady()) {
            const user = await global.User.findOne({ email });
            if (!user) {
                return res.json({ success: false, error: 'Користувача з таким email не знайдено' });
            }

            user.password = password;
            await user.save();
            return res.json({ success: true });
        }

        const user = usersDB.find(u => u.email === email);
        if (!user) {
            return res.json({ success: false, error: 'Користувача з таким email не знайдено' });
        }

        user.password = password;
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// ============================================
// GALLERY ROUTES
// ============================================

// Отримати всі галереї
app.get('/api/galleries', async (req, res) => {
    try {
        if (isMongoGalleryReady()) {
            const galleries = await global.Gallery.find();
            res.json(galleries);
        } else {
            res.json(galleriesDB);
        }
    } catch (err) {
        res.json({ error: err.message });
    }
});

// Отримати галереї користувача
app.get('/api/galleries/:userId', async (req, res) => {
    try {
        if (isMongoGalleryReady()) {
            const galleries = await global.Gallery.find({ photographerId: req.params.userId });
            res.json(galleries);
        } else {
            const galleries = galleriesDB.filter(g => g.photographerId === req.params.userId);
            res.json(galleries);
        }
    } catch (err) {
        res.json({ error: err.message });
    }
});

// Отримати галерею за кодом
app.get('/api/gallery/:code', async (req, res) => {
    try {
        const code = req.params.code.toUpperCase();
        if (isMongoGalleryReady()) {
            const gallery = await global.Gallery.findOne({ code });
            if (gallery) {
                res.json(gallery);
            } else {
                res.json({ error: 'Галерея не знайдена' });
            }
        } else {
            const gallery = galleriesDB.find(g => g.code === code);
            if (gallery) {
                res.json(gallery);
            } else {
                res.json({ error: 'Галерея не знайдена' });
            }
        }
    } catch (err) {
        res.json({ error: err.message });
    }
});

// Створити нову галерею
app.post('/api/galleries', async (req, res) => {
    try {
        const { name, photographerId, accessCode } = req.body;
        const photoCount = Math.max(0, parseInt(req.body.photoCount, 10) || 0);
        const code = accessCode || generateAccessCode();

        if (isMongoGalleryReady()) {
            // MongoDB
            const codeExists = await global.Gallery.findOne({ code });
            if (codeExists) {
                return res.json({ 
                    success: false, 
                    error: 'Цей код уже використовується',
                    suggestion: generateAccessCode()
                });
            }
            const newGallery = new global.Gallery({
                code: code.toUpperCase(),
                name,
                photographerId,
                photoCount,
                selectedPhotos: 0
            });
            await newGallery.save();
            res.json({ success: true, galleryId: newGallery._id, accessCode: newGallery.code });
        } else {
            // In-Memory
            const codeExists = galleriesDB.find(g => g.code === code);
            if (codeExists) {
                return res.json({ 
                    success: false, 
                    error: 'Цей код уже використовується',
                    suggestion: generateAccessCode()
                });
            }
            const newGallery = {
                id: generateGalleryId(),
                code: code.toUpperCase(),
                name,
                photographerId,
                photoCount,
                selectedPhotos: 0,
                createdAt: new Date().toISOString()
            };
            galleriesDB.push(newGallery);
            res.json({ success: true, galleryId: newGallery.id, accessCode: newGallery.code });
        }
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// Оновити галерею
app.put('/api/galleries/:id', async (req, res) => {
    try {
        if (isMongoGalleryReady()) {
            const gallery = await global.Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json({ success: true, gallery });
        } else {
            const gallery = galleriesDB.find(g => g.id === req.params.id);
            if (gallery) {
                Object.assign(gallery, req.body);
                res.json({ success: true, gallery });
            } else {
                res.json({ success: false, error: 'Галерея не знайдена' });
            }
        }
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// Видалити галерею
app.delete('/api/galleries/:id', async (req, res) => {
    try {
        if (isMongoGalleryReady()) {
            await global.Gallery.findByIdAndDelete(req.params.id);
            res.json({ success: true });
        } else {
            const index = galleriesDB.findIndex(g => g.id === req.params.id);
            if (index > -1) {
                galleriesDB.splice(index, 1);
                res.json({ success: true });
            } else {
                res.json({ success: false, error: 'Галерея не знайдена' });
            }
        }
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

// ============================================
// DEBUG ROUTES
// ============================================

// Переглянути всіх користувачів
app.get('/api/debug/users', (req, res) => {
    res.json({ 
        source: mongoConnected ? 'MongoDB Atlas' : 'In-Memory',
        count: usersDB.length, 
        users: usersDB 
    });
});

// Переглянути всі галереї
app.get('/api/debug/galleries', (req, res) => {
    res.json({ 
        source: mongoConnected ? 'MongoDB Atlas' : 'In-Memory',
        count: galleriesDB.length, 
        galleries: galleriesDB 
    });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🚀 SHOTDROP Server запущений!');
    console.log(`${'='.repeat(60)}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`💾 База даних: ${mongoConnected ? '✅ MongoDB Atlas' : '📝 In-Memory (локальна)'}`);
    console.log(`🌐 CORS: Увімкнено`);
    console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🐛 Debug: http://localhost:${PORT}/api/debug/galleries`);
    console.log(`${'='.repeat(60)}\n`);
});
