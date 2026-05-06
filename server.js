const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let usersDB = [];
let galleriesDB = [];
let mongoConnected = false;

galleriesDB = [
    {
        id: 'demo-1',
        code: 'ABC-123',
        name: 'Весілля Олександра',
        photographerId: 'demo-user',
        photoCount: 25,
        selectedPhotos: 0,
        photoStates: {},
        createdAt: new Date().toISOString()
    },
    {
        id: 'demo-2',
        code: 'XYZ-789',
        name: 'Портретна сесія',
        photographerId: 'demo-user',
        photoCount: 15,
        selectedPhotos: 0,
        photoStates: {},
        createdAt: new Date().toISOString()
    }
];

mongoose.set('bufferCommands', false);

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
    selectedPhotos: { type: Number, default: 0 },
    photoStates: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', gallerySchema);

async function connectMongo() {
    if (!process.env.MONGODB_URI) {
        mongoConnected = false;
        return false;
    }

    if (mongoose.connection.readyState === 1) {
        mongoConnected = true;
        return true;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            w: 'majority'
        });
        mongoConnected = true;
        return true;
    } catch (err) {
        mongoConnected = false;
        console.log('MongoDB недоступна, використовується In-Memory база:', err.message);
        return false;
    }
}

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

function normalizeGallery(gallery) {
    if (!gallery) return null;

    const plain = typeof gallery.toObject === 'function' ? gallery.toObject() : gallery;
    const id = String(plain._id || plain.id);

    return {
        id,
        _id: id,
        code: plain.code,
        name: plain.name,
        photographerId: plain.photographerId,
        userId: plain.photographerId,
        photoCount: plain.photoCount || 0,
        selectedPhotos: plain.selectedPhotos || 0,
        photoStates: plain.photoStates || {},
        createdAt: plain.createdAt
    };
}

function countSelectedPhotos(photoStates) {
    return Object.values(photoStates || {}).filter(state => state && state.liked).length;
}

app.use(async (req, res, next) => {
    await connectMongo();
    next();
});

app.use((req, res, next) => {
    if (!req.url.startsWith('/api') && req.url !== '/') {
        req.url = '/api' + req.url;
    }
    next();
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Сервер працює',
        database: mongoConnected ? 'MongoDB Atlas' : 'In-Memory',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (mongoConnected) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.json({ success: false, error: 'Цей email вже зареєстрований' });
            }

            const newUser = new User({ email, password, role: role || 'photographer' });
            await newUser.save();
            return res.json({ success: true, userId: String(newUser._id), role: newUser.role });
        }

        const existingUser = usersDB.find(user => user.email === email);
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
        res.json({ success: true, userId: newUser.id, role: newUser.role });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (mongoConnected) {
            const user = await User.findOne({ email, password });
            if (!user) {
                return res.json({ success: false, error: 'Невірні дані для входу' });
            }

            return res.json({ success: true, userId: String(user._id), role: user.role });
        }

        const user = usersDB.find(item => item.email === email && item.password === password);
        if (!user) {
            return res.json({ success: false, error: 'Невірні дані для входу' });
        }

        res.json({ success: true, userId: user.id, role: user.role });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.post('/api/reset-password', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ success: false, error: 'Вкажіть email і новий пароль' });
        }

        if (password.length < 6) {
            return res.json({ success: false, error: 'Пароль повинен містити щонайменше 6 символів' });
        }

        if (mongoConnected) {
            const user = await User.findOne({ email });
            if (!user) {
                return res.json({ success: false, error: 'Користувача з таким email не знайдено' });
            }

            user.password = password;
            await user.save();
            return res.json({ success: true });
        }

        const user = usersDB.find(item => item.email === email);
        if (!user) {
            return res.json({ success: false, error: 'Користувача з таким email не знайдено' });
        }

        user.password = password;
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.get('/api/galleries', async (req, res) => {
    try {
        if (mongoConnected) {
            const galleries = await Gallery.find().sort({ createdAt: -1 });
            return res.json(galleries.map(normalizeGallery));
        }

        res.json(galleriesDB.map(normalizeGallery));
    } catch (err) {
        res.json({ error: err.message });
    }
});

app.get('/api/galleries/:userId', async (req, res) => {
    try {
        if (mongoConnected) {
            const galleries = await Gallery
                .find({ photographerId: req.params.userId })
                .sort({ createdAt: -1 });
            return res.json(galleries.map(normalizeGallery));
        }

        const galleries = galleriesDB.filter(gallery => gallery.photographerId === req.params.userId);
        res.json(galleries.map(normalizeGallery));
    } catch (err) {
        res.json({ error: err.message });
    }
});

app.get('/api/gallery/:code', async (req, res) => {
    try {
        const code = req.params.code.toUpperCase();

        if (mongoConnected) {
            const gallery = await Gallery.findOne({ code });
            if (!gallery) {
                return res.json({ error: 'Галерею не знайдено' });
            }

            return res.json(normalizeGallery(gallery));
        }

        const gallery = galleriesDB.find(item => item.code === code);
        if (!gallery) {
            return res.json({ error: 'Галерею не знайдено' });
        }

        res.json(normalizeGallery(gallery));
    } catch (err) {
        res.json({ error: err.message });
    }
});

app.post('/api/galleries', async (req, res) => {
    try {
        const { name, photographerId, accessCode } = req.body;
        const photoCount = Math.max(0, parseInt(req.body.photoCount, 10) || 0);
        const code = (accessCode || generateAccessCode()).toUpperCase();

        if (mongoConnected) {
            const codeExists = await Gallery.findOne({ code });
            if (codeExists) {
                return res.json({
                    success: false,
                    error: 'Цей код уже використовується',
                    suggestion: generateAccessCode()
                });
            }

            const newGallery = new Gallery({
                code,
                name,
                photographerId,
                photoCount,
                selectedPhotos: 0,
                photoStates: {}
            });
            await newGallery.save();

            return res.json({
                success: true,
                galleryId: String(newGallery._id),
                accessCode: newGallery.code,
                gallery: normalizeGallery(newGallery)
            });
        }

        const codeExists = galleriesDB.find(gallery => gallery.code === code);
        if (codeExists) {
            return res.json({
                success: false,
                error: 'Цей код уже використовується',
                suggestion: generateAccessCode()
            });
        }

        const newGallery = {
            id: generateGalleryId(),
            code,
            name,
            photographerId,
            photoCount,
            selectedPhotos: 0,
            photoStates: {},
            createdAt: new Date().toISOString()
        };
        galleriesDB.push(newGallery);
        res.json({
            success: true,
            galleryId: newGallery.id,
            accessCode: newGallery.code,
            gallery: normalizeGallery(newGallery)
        });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.put('/api/galleries/:id', async (req, res) => {
    try {
        if (mongoConnected) {
            const gallery = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!gallery) {
                return res.json({ success: false, error: 'Галерею не знайдено' });
            }

            return res.json({ success: true, gallery: normalizeGallery(gallery) });
        }

        const gallery = galleriesDB.find(item => item.id === req.params.id);
        if (!gallery) {
            return res.json({ success: false, error: 'Галерею не знайдено' });
        }

        Object.assign(gallery, req.body);
        res.json({ success: true, gallery: normalizeGallery(gallery) });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.put('/api/gallery/:code/photo-states', async (req, res) => {
    try {
        const code = req.params.code.toUpperCase();
        const photoStates = req.body.photoStates || {};
        const selectedPhotos = countSelectedPhotos(photoStates);

        if (mongoConnected) {
            const gallery = await Gallery.findOneAndUpdate(
                { code },
                { photoStates, selectedPhotos },
                { new: true }
            );

            if (!gallery) {
                return res.json({ success: false, error: 'Галерею не знайдено' });
            }

            return res.json({ success: true, gallery: normalizeGallery(gallery) });
        }

        const gallery = galleriesDB.find(item => item.code === code);
        if (!gallery) {
            return res.json({ success: false, error: 'Галерею не знайдено' });
        }

        gallery.photoStates = photoStates;
        gallery.selectedPhotos = selectedPhotos;
        res.json({ success: true, gallery: normalizeGallery(gallery) });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.delete('/api/galleries/:id', async (req, res) => {
    try {
        if (mongoConnected) {
            await Gallery.findByIdAndDelete(req.params.id);
            return res.json({ success: true });
        }

        const index = galleriesDB.findIndex(gallery => gallery.id === req.params.id);
        if (index === -1) {
            return res.json({ success: false, error: 'Галерею не знайдено' });
        }

        galleriesDB.splice(index, 1);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.get('/api/debug/users', (req, res) => {
    res.json({
        source: mongoConnected ? 'MongoDB Atlas' : 'In-Memory',
        count: usersDB.length,
        users: usersDB
    });
});

app.get('/api/debug/galleries', async (req, res) => {
    try {
        if (mongoConnected) {
            const galleries = await Gallery.find().sort({ createdAt: -1 });
            return res.json({
                source: 'MongoDB Atlas',
                count: galleries.length,
                galleries: galleries.map(normalizeGallery)
            });
        }

        res.json({
            source: 'In-Memory',
            count: galleriesDB.length,
            galleries: galleriesDB.map(normalizeGallery)
        });
    } catch (err) {
        res.json({ error: err.message });
    }
});

if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`SHOTDROP server запущено: http://localhost:${PORT}`);
        console.log(`База даних: ${mongoConnected ? 'MongoDB Atlas' : 'In-Memory'}`);
    });
}

module.exports = app;
