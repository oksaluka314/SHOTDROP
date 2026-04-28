const port = process.env.PORT || 8652;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
// SHOTDROP - Photo Delivery Service
// Main JavaScript file for interactive functionality

// ============================================
// 1. NAVIGATION & UI INTERACTIONS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initButtons();
    initGallery();
    initForms();
});

// Initialize navigation menu
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });

    const sidebarItems = document.querySelectorAll('.sidebar-nav .nav-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            sidebarItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// ============================================
// 2. BUTTON INTERACTIONS
// ============================================

function initButtons() {
    // "New Shoot" button
    const btnAdd = document.querySelector('.btn-add');
    if (btnAdd) {
        btnAdd.addEventListener('click', function(e) {
            e.preventDefault();
            openNewProjectModal();
        });
    }

    // CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-main, .btn-client');
    ctaButtons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

// ============================================
// 3. PHOTO GALLERY FUNCTIONS
// ============================================

function initGallery() {
    const photoCards = document.querySelectorAll('.photo-card');
    
    photoCards.forEach(card => {
        const likeBtn = card.querySelector('.like-btn');
        const commentBtn = card.querySelector('.comment-btn');
        
        if (likeBtn) {
            likeBtn.addEventListener('click', function() {
                toggleLike(this, card);
            });
        }
        
        if (commentBtn) {
            commentBtn.addEventListener('click', function() {
                openCommentModal(card);
            });
        }
    });
}

// Toggle like/heart button
function toggleLike(button, card) {
    const isLiked = button.classList.contains('liked');
    
    if (isLiked) {
        button.classList.remove('liked');
        button.innerHTML = '🤍';
        button.title = 'Додати до обраних';
    } else {
        button.classList.add('liked');
        button.innerHTML = '❤️';
        button.title = 'Видалити з обраних';
    }
    
    // Save to local storage
    const photoId = card.getAttribute('data-photo-id');
    saveLikedPhoto(photoId, !isLiked);
}

// ============================================
// 4. MODAL FUNCTIONS
// ============================================

function openNewProjectModal() {
    const modal = createModal(
        'Нова зйомка',
        `<form>
            <label>Назва проєкту:</label>
            <input type="text" placeholder="Наприклад: Весілля Олександра та Марії" required>
            
            <label>Опис:</label>
            <textarea placeholder="Додайте опис проєкту"></textarea>
            
            <label>Дата зйомки:</label>
            <input type="date" required>
            
            <button type="submit" class="btn-submit">Створити проєкт</button>
        </form>`
    );
    
    const form = modal.querySelector('form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        createNewProject();
        closeModal(modal);
    });
}

function openCommentModal(photoCard) {
    const modal = createModal(
        'Додати побажання',
        `<form>
            <textarea placeholder="Напишіть свої побажання для ретуші..." maxlength="500" required></textarea>
            <small>Залишилось символів: <span id="char-count">500</span></small>
            
            <button type="submit" class="btn-submit">Відправити</button>
        </form>`
    );
    
    const textarea = modal.querySelector('textarea');
    const charCount = modal.querySelector('#char-count');
    
    textarea.addEventListener('input', function() {
        charCount.textContent = 500 - this.value.length;
    });
    
    const form = modal.querySelector('form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveComment(photoCard, textarea.value);
        closeModal(modal);
    });
}

// Create modal window
function createModal(title, content) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-header">
            <h2>${title}</h2>
            <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
            ${content}
        </div>
    `;
    
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => closeModal(modalOverlay));
    
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal(this);
        }
    });
    
    return modal;
}

function closeModal(modal) {
    const overlay = modal.closest('.modal-overlay') || modal;
    overlay.remove();
}

// ============================================
// 5. FORM HANDLING
// ============================================

function initForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        // Add real-time validation
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
        });
    });
}

function validateField(field) {
    if (field.type === 'email') {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
        field.style.borderColor = isValid ? '#4caf50' : '#f44336';
    } else if (field.hasAttribute('required') && !field.value.trim()) {
        field.style.borderColor = '#f44336';
    } else {
        field.style.borderColor = '#4caf50';
    }
}

// ============================================
// 6. DATA MANAGEMENT (LocalStorage)
// ============================================

function saveLikedPhoto(photoId, isLiked) {
    let liked = JSON.parse(localStorage.getItem('likedPhotos')) || [];
    
    if (isLiked) {
        if (!liked.includes(photoId)) {
            liked.push(photoId);
        }
    } else {
        liked = liked.filter(id => id !== photoId);
    }
    
    localStorage.setItem('likedPhotos', JSON.stringify(liked));
}

function getLikedPhotos() {
    return JSON.parse(localStorage.getItem('likedPhotos')) || [];
}

function saveComment(photoCard, comment) {
    let comments = JSON.parse(localStorage.getItem('photoComments')) || {};
    const photoId = photoCard.getAttribute('data-photo-id');
    
    if (!comments[photoId]) {
        comments[photoId] = [];
    }
    
    comments[photoId].push({
        text: comment,
        timestamp: new Date().toLocaleString('uk-UA')
    });
    
    localStorage.setItem('photoComments', JSON.stringify(comments));
    
    // Show success message
    showNotification('Побажання збережено! 📝');
}

function getComments(photoId) {
    const comments = JSON.parse(localStorage.getItem('photoComments')) || {};
    return comments[photoId] || [];
}

// ============================================
// 7. NOTIFICATIONS
// ============================================

function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
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
// 8. PROJECT CREATION
// ============================================

function createNewProject() {
    showNotification('Проєкт успішно створений! 🎉');
    
    // In a real app, this would send data to a server
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    projects.push({
        id: Date.now(),
        created: new Date().toLocaleDateString('uk-UA')
    });
    localStorage.setItem('projects', JSON.stringify(projects));
}

// ============================================
// 9. PHOTO GRID INTERACTIONS
// ============================================

function initPhotoGridHover() {
    const photoCards = document.querySelectorAll('.photo-card');
    
    photoCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });
    });
}

// ============================================
// 10. UTILITY FUNCTIONS
// ============================================

// Format date in Ukrainian locale
function formatDate(date) {
    return new Date(date).toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Get user's device type
function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/.test(ua)) {
        return 'mobile';
    }
    return 'desktop';
}

// Copy access link to clipboard
function copyAccessLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        showNotification('Посилання скопійовано! 📋');
    });
}

// Generate unique access code
function generateAccessCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ============================================
// 11. ANIMATIONS
// ============================================

// Add animation styles to page
function addAnimationStyles() {
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
        
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 999;
        }
        
        .modal {
            background: white;
            border-radius: 10px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease-in-out;
        }
        
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h2 {
            margin: 0;
            font-size: 20px;
        }
        
        .modal-close {
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #999;
        }
        
        .modal-close:hover {
            color: #333;
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .modal-body form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .modal-body label {
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .modal-body input,
        .modal-body textarea {
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-family: inherit;
            font-size: 14px;
        }
        
        .modal-body input:focus,
        .modal-body textarea:focus {
            outline: none;
            border-color: #f8bbd9;
        }
        
        .btn-submit {
            background: #f8bbd9;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
        }
        
        .btn-submit:hover {
            background: #f48fb1;
            transform: scale(1.02);
        }
    `;
    document.head.appendChild(style);
}

// Initialize animations on page load
addAnimationStyles();
