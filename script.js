
// ============================================
// API CONFIGURATION
// ============================================
const API_BASE = '/api';

console.log('Адреса API:', API_BASE);

async function checkServerHealth() {
    try {
        const response = await fetch(API_BASE + '/health', { timeout: 3000 });
        const data = await response.json();
        console.log('Сервер доступний:', data);
        return true;
    } catch (err) {
        console.warn('Сервер недоступний:', err.message);
        return false;
    }
}

checkServerHealth();

// ============================================
// STORAGE MANAGER - localStorage helpers
// ============================================
class StorageManager {
    static getUsers() {
        const users = localStorage.getItem('shotdrop_users');
        return users ? JSON.parse(users) : [];
    }

    static saveUsers(users) {
        localStorage.setItem('shotdrop_users', JSON.stringify(users));
    }

    static getGalleries() {
        const galleries = localStorage.getItem('shotdrop_galleries');
        return galleries ? JSON.parse(galleries) : [];
    }

    static saveGalleries(galleries) {
        localStorage.setItem('shotdrop_galleries', JSON.stringify(galleries));
    }

    static getCurrentUser() {
        const user = localStorage.getItem('shotdrop_currentUser');
        return user ? JSON.parse(user) : null;
    }

    static setCurrentUser(user) {
        if (user) {
            localStorage.setItem('shotdrop_currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('shotdrop_currentUser');
        }
    }

    static getTheme() {
        return localStorage.getItem('shotdrop_theme') || 'light';
    }

    static setTheme(theme) {
        localStorage.setItem('shotdrop_theme', theme);
    }

    static generateUniqueCode() {
        const part1 = Math.random().toString(36).substr(2, 3).toUpperCase();
        const part2 = Math.random().toString(36).substr(2, 3).toUpperCase();
        return part1 + '-' + part2;
    }

    static generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    static generateGalleryId() {
        return 'gallery_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// ============================================
// THEME MANAGER - Light/Dark mode
// ============================================
class ThemeManager {
    static init() {
        const theme = StorageManager.getTheme();
        this.applyTheme(theme);
        this.addThemeSwitcher();
    }

    static applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        StorageManager.setTheme(theme);
        
        const themeBtn = document.getElementById('theme-switcher');
        if (themeBtn) {
            themeBtn.textContent = theme === 'light' ? '☀️' : '🌘';
        }
    }

    static toggle() {
        const currentTheme = StorageManager.getTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    static addThemeSwitcher() {
        const headers = document.getElementsByClassName('header');
        for (let header of headers) {
            if (!header.querySelector('.theme-btn')) {
                const themeBtn = document.createElement('button');
                themeBtn.className = 'theme-btn';
                themeBtn.textContent = StorageManager.getTheme() === 'light' ? '☀️' : '🌘';
                themeBtn.addEventListener('click', () => ThemeManager.toggle());
                header.appendChild(themeBtn);
            }
        }
    }
}

// ============================================
// AUTH MANAGER - Registration & Login
// ============================================
class AuthManager {
    static async register(email, password, confirmPassword) {
        if (password !== confirmPassword) {
            alert('Паролі не збігаються!');
            return false;
        }

        if (password.length < 6) {
            alert('Пароль повинен містити щонайменше 6 символів!');
            return false;
        }

        try {
            console.log('Надсилаємо запит на реєстрацію...');
            const response = await fetch(API_BASE + '/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: 'photographer' })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Відповідь сервера:', data);
            
            if (data.success) {
                alert('Реєстрація успішна!');
                StorageManager.setCurrentUser({ id: data.userId, email });
                window.location.href = 'dashboard.html';
                return true;
            } else {
                alert('Помилка реєстрації:\n' + (data.error || 'Невідома помилка'));
                return false;
            }
        } catch (err) {
            console.error('Помилка під час реєстрації:', err);
            alert('Не вдалося зареєструватися на сервері. Перевірте підключення або налаштування API.');
            return false;
        }
    }

    static async login(email, password) {
        try {
            console.log('Надсилаємо запит на вхід...');
            const response = await fetch(API_BASE + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Відповідь сервера:', data);
            
            if (data.success) {
                StorageManager.setCurrentUser({ id: data.userId, email });
                alert('Вхід успішний!');
                window.location.href = 'dashboard.html';
                return true;
            } else {
                alert(data.error || 'Невірні дані для входу');
                return false;
            }
        } catch (err) {
            console.error('Помилка під час входу:', err);
            alert('Не вдалося увійти через сервер. Перевірте підключення або налаштування API.');
            return false;
        }
    }

    static async resetPassword(email, password, confirmPassword) {
        if (!email) {
            alert('Вкажіть email акаунта');
            return false;
        }

        if (password !== confirmPassword) {
            alert('Паролі не збігаються');
            return false;
        }

        if (password.length < 6) {
            alert('Пароль повинен містити щонайменше 6 символів');
            return false;
        }

        try {
            const response = await fetch(API_BASE + '/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                alert('Пароль змінено. Тепер увійдіть із новим паролем.');
                this.switchTab('login');
                const loginEmail = document.getElementById('login-email');
                if (loginEmail) loginEmail.value = email;
                return true;
            }

            alert('Помилка: ' + (data.error || 'Не вдалося змінити пароль'));
            return false;
        } catch (err) {
            console.error('Помилка під час скидання пароля:', err);
            alert('Не вдалося змінити пароль. Перевірте email або підключення до сервера.');
            return false;
        }
    }

    static resetLocalPassword(email, password) {
        const users = StorageManager.getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            return false;
        }

        user.password = password;
        StorageManager.saveUsers(users);
        return true;
    }

    static switchTab(tabName) {
        const tabs = document.querySelectorAll('.tab');
        const forms = document.querySelectorAll('.tab-content');
        const targetForm = document.getElementById(tabName + '-form');

        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
        });

        forms.forEach(form => form.classList.remove('active'));
        if (targetForm) {
            targetForm.classList.add('active');
        }
    }

    static logout() {
        StorageManager.setCurrentUser(null);
        window.location.href = 'index.html';
    }

    static isLoggedIn() {
        return StorageManager.getCurrentUser() !== null;
    }

    static checkAuthProtection() {
        const protectedPages = ['dashboard.html', 'private-gallery.html'];
        const currentPage = window.location.pathname.split('/').pop();

        if (protectedPages.includes(currentPage) && !this.isLoggedIn()) {
            window.location.href = 'accaunt.html';
        }
    }

    static initAuthForms() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                this.login(email, password);
            });
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('register-email').value;
                const password = document.getElementById('register-password').value;
                const confirm = document.getElementById('register-confirm').value;
                this.register(email, password, confirm);
            });
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        const forgotPasswordLink = document.getElementById('forgot-password-link');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                const currentEmail = document.getElementById('login-email')?.value || '';
                const email = prompt('Введіть email акаунта:', currentEmail);
                if (email === null) return;

                const password = prompt('Введіть новий пароль (мінімум 6 символів):');
                if (password === null) return;

                const confirm = prompt('Повторіть новий пароль:');
                if (confirm === null) return;

                this.resetPassword(email.trim(), password, confirm);
            });
        }

        const alreadyAccountLink = document.getElementById('already-account-link');
        if (alreadyAccountLink) {
            alreadyAccountLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab('login');
            });
        }
    }
}

// ============================================
// GALLERY MANAGER - Create, Update, Delete
// ============================================
class GalleryManager {
    static async createGallery(name, photoCount = 0) {
        const currentUser = StorageManager.getCurrentUser();
        if (!currentUser) return false;

        try {
            console.log('Створюємо галерею на сервері...');
            const response = await fetch(API_BASE + '/galleries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    photographerId: currentUser.id,
                    photoCount: photoCount,
                    accessCode: this.generateAccessCode()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Відповідь сервера:', data);
            
            if (data.success) {
                return this.upsertGalleryFromServer(data.gallery || {
                    id: data.galleryId,
                    code: data.accessCode,
                    name,
                    photographerId: currentUser.id,
                    photoCount,
                    selectedPhotos: 0,
                    photoStates: {},
                    createdAt: new Date().toISOString()
                });
            } else {
                alert('Помилка на сервері: ' + data.error);
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('Помилка під час створення галереї на сервері:', err);
            alert('Не вдалося створити галерею на сервері. Перевірте підключення або налаштування API.');
            return false;
        }
    }

    static generateAccessCode() {
        const part1 = Math.random().toString(36).substr(2, 3).toUpperCase();
        const part2 = Math.random().toString(36).substr(2, 3).toUpperCase();
        const part3 = Math.floor(Math.random() * 1000);
        return `${part1}-${part2}-${part3}`;
    }

    static generateSamplePhotos(count) {
        const sampleImages = [
            'https://i.pinimg.com/736x/f4/52/ce/f452ce0c355088846809f040ace7d0d1.jpg',
            'https://i.pinimg.com/736x/4b/82/ed/4b82eda1ca6ea7c78e1e2162f48914f3.jpg',
            'https://i.pinimg.com/736x/ec/8d/ad/ec8dad918eb25d162fa45344eacb3ae7.jpg',
            'https://i.pinimg.com/736x/5b/7a/99/5b7a99cdd58858bba39a9fb178b4a8da.jpg',
            'https://i.pinimg.com/736x/2d/a6/cf/2da6cf66094eb064216d51334b14f095.jpg',
            'https://i.pinimg.com/736x/82/30/9c/82309c6617b5c6dd29a809b862953238.jpg',
            'https://i.pinimg.com/736x/75/4a/75/754a75ad59253a54c87e26938a8d8cbf.jpg'
        ];

        const photos = [];
        for (let i = 0; i < count; i++) {
            photos.push({
                id: 'photo_' + i,
                url: sampleImages[i % sampleImages.length]
            });
        }
        return photos;
    }

    static normalizeGalleryPhotos(gallery) {
        const photoCount = Math.max(0, parseInt(gallery.photoCount, 10) || 0);

        if (!Array.isArray(gallery.photos) || gallery.photos.length !== photoCount) {
            gallery.photos = this.generateSamplePhotos(photoCount);
        }

        gallery.photoCount = gallery.photos.length;
        return gallery;
    }

    static saveNormalizedGallery(gallery) {
        const galleries = StorageManager.getGalleries();
        const index = galleries.findIndex(g => g.id === gallery.id || g.code === gallery.code);

        if (index !== -1) {
            galleries[index] = gallery;
            StorageManager.saveGalleries(galleries);
        }
    }

    static getPhotoStateKey(galleryCode, photoId) {
        return `${galleryCode}::${photoId}`;
    }

    static getPhotoStates(galleryCode) {
        const gallery = StorageManager.getGalleries().find(g => g.code === galleryCode);
        return gallery?.photoStates || {};
    }

    static async savePhotoStates(galleryCode, states) {
        const galleries = StorageManager.getGalleries();
        const gallery = galleries.find(g => g.code === galleryCode);

        if (gallery) {
            gallery.photoStates = states;
            gallery.selectedPhotos = Object.values(states).filter(state => state?.liked).length;
            StorageManager.saveGalleries(galleries);
        }

        const response = await fetch(API_BASE + '/gallery/' + galleryCode + '/photo-states', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoStates: states })
        });
        const data = await response.json();

        if (data.success && data.gallery) {
            return this.upsertGalleryFromServer(data.gallery);
        }

        throw new Error(data.error || 'Не вдалося зберегти стан фото');
    }

    static getPhotoState(galleryCode, photoId) {
        const states = this.getPhotoStates(galleryCode);
        const key = this.getPhotoStateKey(galleryCode, photoId);

        return states[key] || { liked: false, comments: [] };
    }

    static async setPhotoState(galleryCode, photoId, state) {
        const states = this.getPhotoStates(galleryCode);
        const key = this.getPhotoStateKey(galleryCode, photoId);
        states[key] = state;
        return this.savePhotoStates(galleryCode, states);
    }

    static syncSelectedCount(galleryCode) {
        const galleries = StorageManager.getGalleries();
        const gallery = galleries.find(g => g.code === galleryCode);
        if (!gallery) return;

        const states = this.getPhotoStates(galleryCode);
        gallery.selectedPhotos = (gallery.photos || []).filter(photo => {
            const key = this.getPhotoStateKey(galleryCode, photo.id);
            return states[key]?.liked;
        }).length;

        StorageManager.saveGalleries(galleries);
    }

    static async getUserGalleries() {
        const currentUser = StorageManager.getCurrentUser();
        if (!currentUser) return [];

        try {
            const response = await fetch(API_BASE + '/galleries/' + currentUser.id);
            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error(data.error || 'Не вдалося завантажити галереї');
            }

            const userGalleries = data.map(gallery => this.upsertGalleryFromServer(gallery));
            const otherGalleries = StorageManager.getGalleries()
                .filter(gallery => gallery.userId !== currentUser.id);
            StorageManager.saveGalleries([...otherGalleries, ...userGalleries]);
            return userGalleries;
        } catch (err) {
            console.error('Помилка завантаження галерей:', err);
            alert('Не вдалося завантажити галереї з сервера.');
            return [];
        }
    }

    static getCachedUserGalleries() {
        const currentUser = StorageManager.getCurrentUser();
        if (!currentUser) return [];

        const galleries = StorageManager.getGalleries();
        let changed = false;

        const userGalleries = galleries
            .filter(g => g.userId === currentUser.id)
            .map(gallery => {
                const oldLength = Array.isArray(gallery.photos) ? gallery.photos.length : -1;
                const normalized = this.normalizeGalleryPhotos(gallery);

                if (oldLength !== normalized.photos.length) {
                    changed = true;
                }

                return normalized;
            });

        if (changed) {
            StorageManager.saveGalleries(galleries);
        }

        return userGalleries;
    }

    static async getGalleryByCode(code) {
        try {
            const response = await fetch(API_BASE + '/gallery/' + code);
            const data = await response.json();

            if (data.error || (!data.id && !data._id)) {
                throw new Error(data.error || 'Галерею не знайдено');
            }

            return this.upsertGalleryFromServer(data);
        } catch (err) {
            console.error('Помилка завантаження галереї:', err);
            return null;
        }
    }

    static getCachedGalleryByCode(code) {
        const gallery = StorageManager.getGalleries().find(g => g.code === code);
        if (!gallery) return null;

        const normalized = this.normalizeGalleryPhotos(gallery);
        this.saveNormalizedGallery(normalized);
        return normalized;
    }

    static getGalleryById(id) {
        const gallery = StorageManager.getGalleries().find(g => g.id === id);
        if (!gallery) return null;

        const normalized = this.normalizeGalleryPhotos(gallery);
        this.saveNormalizedGallery(normalized);
        return normalized;
    }

    static updateGallery(id, updates) {
        const galleries = StorageManager.getGalleries();
        const gallery = galleries.find(g => g.id === id);
        if (gallery) {
            Object.assign(gallery, updates);
            StorageManager.saveGalleries(galleries);
        }
        return gallery;
    }

    static upsertGalleryFromServer(serverGallery) {
        const galleries = StorageManager.getGalleries();
        const id = serverGallery.id || serverGallery._id;
        const existingIndex = galleries.findIndex(g => g.code === serverGallery.code || g.id === id);
        const gallery = this.normalizeGalleryPhotos({
            id,
            code: serverGallery.code,
            name: serverGallery.name,
            userId: serverGallery.userId || serverGallery.photographerId || id,
            photoCount: serverGallery.photoCount || 0,
            selectedPhotos: serverGallery.selectedPhotos || 0,
            photoStates: serverGallery.photoStates || {},
            createdAt: serverGallery.createdAt || new Date().toISOString(),
            photos: serverGallery.photos
        });

        if (existingIndex === -1) {
            galleries.push(gallery);
        } else {
            galleries[existingIndex] = { ...galleries[existingIndex], ...gallery };
        }

        StorageManager.saveGalleries(galleries);
        return gallery;
    }

    static deleteGallery(id) {
        let galleries = StorageManager.getGalleries();
        galleries = galleries.filter(g => g.id !== id);
        StorageManager.saveGalleries(galleries);
    }
}

// ============================================
// DASHBOARD MANAGER
// ============================================
class DashboardManager {
    static init() {
        this.renderGalleries();
        this.setupAddNewGallery();
    }

    static async renderGalleries() {
        const galleries = await GalleryManager.getUserGalleries();
        const projectGrid = document.querySelector('.project-grid');

        if (!projectGrid) return;

        projectGrid.innerHTML = '';

        galleries.forEach(gallery => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <div class="project-thumb">
                    <a href="private-gallery.html?code=${gallery.code}">
                        <img src="${gallery.photos?.[0]?.url || 'https://i.pinimg.com/736x/f4/52/ce/f452ce0c355088846809f040ace7d0d1.jpg'}" alt="">
                    </a>
                    <span class="project-status">Активна</span>
                </div>
                <div class="project-info">
                    <h3>${gallery.name}</h3>
                    <div class="project-stats">
                        <span><span id="count-${gallery.id}">${gallery.photoCount}</span> фото</span>
                        <span><span id="selected-${gallery.id}">${gallery.selectedPhotos}</span> відібрано</span>
                    </div>
                    <div style="margin-top: 10px; font-size: 12px;">
                        Код: <strong>${gallery.code}</strong>
                        <button onclick="copyToClipboard('${gallery.code}')" style="margin-left: 10px; padding: 5px 10px;">Скопіювати</button>
                    </div>
                </div>
            `;
            projectGrid.appendChild(card);
        });
    }

    static setupAddNewGallery() {
        const addBtn = document.querySelector('.btn-add');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.createNewGallery();
            });
        }
    }

    static async createNewGallery() {
        const name = prompt('Введіть назву нової зйомки:');
        if (!name) return;

        const photoCountStr = prompt('Скільки фото у цій зйомці?', '20');
        if (!photoCountStr) return;

        const photoCount = parseInt(photoCountStr) || 20;
        const gallery = await GalleryManager.createGallery(name, photoCount);
        
        if (gallery) {
            alert(`Нова галерея створена!\n\nКод доступу: ${gallery.code}\n\nПоділіться цим кодом з клієнтом.`);
            this.renderGalleries();
        }
    }
}

// ============================================
// CLIENT ACCESS MANAGER
// ============================================
class ClientAccessManager {
    static init() {
        const accessForm = document.querySelector('.access-form');
        if (accessForm) {
            accessForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAccessCode();
            });
        }
    }

    static async handleAccessCode() {
        const codeInput = document.getElementById('access-code');
        const code = codeInput.value.trim().toUpperCase();

        console.log('Пошук галереї за кодом:', code);

        const gallery = await GalleryManager.getGalleryByCode(code);
        if (gallery) {
            console.log('Галерею знайдено на сервері');
            sessionStorage.setItem('gallery_code', code);
            window.location.href = 'private-gallery.html?code=' + code;
        } else {
            alert('Галерею не знайдено за кодом: ' + code);
            codeInput.value = '';
        }
    }
}

// ============================================
// PRIVATE GALLERY MANAGER
// ============================================
class PrivateGalleryManager {
    static currentGallery = null;
    static currentPhoto = null;

    static init() {
        this.loadGalleryFromCode();
        this.setupDownloadButton();
        this.setupModalClose();
    }

    static async loadGalleryFromCode() {
        const code = new URLSearchParams(window.location.search).get('code') ||
                     sessionStorage.getItem('gallery_code');

        if (!code) {
            console.log('Код галереї не знайдено');
            return;
        }

        const gallery = await GalleryManager.getGalleryByCode(code);
        if (gallery) {
            this.currentGallery = gallery;
            this.displayGallery(gallery);
            sessionStorage.setItem('gallery_code', code);
        } else {
            alert('Галерею не знайдено за цим кодом!');
        }
    }

    static displayGallery(gallery) {
        const galleryInfo = document.querySelector('.gallery-info');
        if (galleryInfo) {
            galleryInfo.innerHTML = `
                <p>${this.escapeHtml(gallery.name)}</p>
                <p style="font-size: 15px;">Фотограф: SHOTDROP •
                    <span id="photo-count">${gallery.photoCount}</span> фото</p>
            `;
        }

        const photoGrid = document.getElementById('photo-grid');
        if (!photoGrid) return;

        photoGrid.innerHTML = '';
        photoGrid.style.display = 'flex';
        photoGrid.style.flexWrap = 'wrap';
        photoGrid.style.justifyContent = 'center';

        const photos = Array.isArray(gallery.photos) ? gallery.photos : [];

        photos.forEach(photo => {
            const state = GalleryManager.getPhotoState(gallery.code, photo.id);
            const photoCard = document.createElement('button');
            photoCard.className = 'photo-card';
            photoCard.type = 'button';
            photoCard.innerHTML = `
                <img src="${photo.url}" alt="">
                <div class="photo-overlay">
                    <div class="icon-badge ${state.liked ? 'active' : ''}">❤️</div>
                    <div class="icon-badge">${state.comments.length ? state.comments.length : '💬'}</div>
                </div>
            `;
            photoCard.addEventListener('click', () => this.openPhotoModal(photo));
            photoGrid.appendChild(photoCard);
        });
    }

    static ensurePhotoModal() {
        let modal = document.getElementById('photoModal');
        if (modal) return modal;

        modal = document.createElement('div');
        modal.className = 'modal photo-popup';
        modal.id = 'photoModal';
        modal.innerHTML = `
            <button class="close-modal" type="button" onclick="closePhoto()">×</button>
            <div class="modal-image-side">
                <img id="modalImg" src="" alt="Full size photo">
            </div>
            <div class="modal-sidebar">
                <div class="like-section">
                    <button class="btn-like" id="likeBtn" type="button" onclick="toggleLike()">
                        <span id="likeIcon">♡</span> Мені подобається це фото
                    </button>
                </div>
                <div class="comments-section" id="commentsList">
                    <h3 class="comments-title">Коментарі до фото</h3>
                </div>
                <div class="comment-input-area">
                    <textarea id="commentText" placeholder="Напишіть коментар або побажання до ретуші..."></textarea>
                    <button class="btn-send" type="button" onclick="addComment()">Надіслати коментар</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    static openPhotoModal(photo) {
        if (!this.currentGallery) return;

        this.currentPhoto = photo;
        const modal = this.ensurePhotoModal();
        document.getElementById('modalImg').src = photo.url;
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        this.renderPhotoActions();
    }

    static closePhotoModal() {
        const modal = document.getElementById('photoModal');
        if (modal) modal.classList.remove('active');
        document.body.classList.remove('modal-open');
        this.currentPhoto = null;
    }

    static renderPhotoActions() {
        if (!this.currentGallery || !this.currentPhoto) return;

        const state = GalleryManager.getPhotoState(this.currentGallery.code, this.currentPhoto.id);
        const likeIcon = document.getElementById('likeIcon');
        const likeBtn = document.getElementById('likeBtn');
        const commentsList = document.getElementById('commentsList');

        if (likeIcon) likeIcon.textContent = state.liked ? '♥' : '♡';
        if (likeBtn) likeBtn.classList.toggle('active', state.liked);

        if (commentsList) {
            const commentsHtml = state.comments.length
                ? state.comments.map(comment => `
                    <div class="comment-item">
                        <strong>${this.escapeHtml(comment.author)}</strong>
                        <p>${this.escapeHtml(comment.text)}</p>
                    </div>
                `).join('')
                : '<p class="empty-comments">Коментарів ще немає.</p>';

            commentsList.innerHTML = `
                <h3 class="comments-title">Коментарі до фото</h3>
                ${commentsHtml}
            `;
        }
    }

    static async toggleCurrentPhotoLike() {
        if (!this.currentGallery || !this.currentPhoto) return;

        const state = GalleryManager.getPhotoState(this.currentGallery.code, this.currentPhoto.id);
        state.liked = !state.liked;
        this.currentGallery = await GalleryManager.setPhotoState(this.currentGallery.code, this.currentPhoto.id, state);
        this.renderPhotoActions();
        this.displayGallery(this.currentGallery);
    }

    static async addCurrentPhotoComment() {
        if (!this.currentGallery || !this.currentPhoto) return;

        const commentText = document.getElementById('commentText');
        const text = commentText.value.trim();
        if (!text) return;

        const state = GalleryManager.getPhotoState(this.currentGallery.code, this.currentPhoto.id);
        state.comments.push({
            author: 'Клієнт',
            text,
            createdAt: new Date().toISOString()
        });

        this.currentGallery = await GalleryManager.setPhotoState(this.currentGallery.code, this.currentPhoto.id, state);
        commentText.value = '';
        this.renderPhotoActions();
        this.displayGallery(this.currentGallery);
    }

    static setupModalClose() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closePhotoModal();
        });

        document.addEventListener('click', (e) => {
            const modal = document.getElementById('photoModal');
            if (modal && e.target === modal) this.closePhotoModal();
        });
    }

    static setupDownloadButton() {
        const downloadBtn = document.querySelector('.btn-download-all');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.currentGallery) {
                    alert(`Завантаження почалось!\n\n(${this.currentGallery.photoCount} фото)\n\nУ реальному додатку тут був би ZIP архів з усіма фото.`);
                } else {
                    alert('Завантаження почалось!');
                }
            });
        }
    }

    static escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }
}

function closePhoto() {
    PrivateGalleryManager.closePhotoModal();
}

function toggleLike() {
    PrivateGalleryManager.toggleCurrentPhotoLike();
}

function addComment() {
    PrivateGalleryManager.addCurrentPhotoComment();
}
// ============================================
// UTILITY FUNCTIONS
// ============================================
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Код скопійовано: ' + text);
    }).catch(() => {
        alert('Помилка під час копіювання');
    });
}

function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #6a4c93;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease-in-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in-out';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// ============================================
// INITIALIZATION - Run on page load
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication for protected pages
    AuthManager.checkAuthProtection();

    // Initialize theme
    ThemeManager.init();

    // Initialize auth forms
    AuthManager.initAuthForms();

    // Page-specific initialization
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'dashboard.html') {
        DashboardManager.init();
    } else if (currentPage === 'private-gallery.html') {
        PrivateGalleryManager.init();
    } else if (currentPage === 'client-access.html') {
        ClientAccessManager.init();
    }

    console.log('Застосунок SHOTDROP ініціалізовано');
    console.log('Тема:', StorageManager.getTheme());
    console.log('Користувач:', AuthManager.isLoggedIn() ? 'Авторизований' : 'Гість');
});

// ============================================
// ANIMATIONS
// ============================================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

