const supabaseUrl = 'https://tkmsvdavwtykvqvidozy.supabase.co'; 
const supabaseKey = 'sb_publishable_Kgilulrm6Dkw9bD9WVjjEg_0nLwl1Qz';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    // ПЕРЕМИКАННЯ ТЕМИ
    const btnTheme = document.getElementById('theme-toggle');
    
    const updateTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        if (btnTheme) {
            btnTheme.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
    };

    const savedTheme = localStorage.getItem('theme') || 'light';
    updateTheme(savedTheme);

    if (btnTheme) {
        btnTheme.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            updateTheme(newTheme);
        });
    }

    // ПЕРЕМИКАННЯ ВХОДУ/РЕЄСТРАЦІЇ
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${target}-form`).classList.add('active');
        });
    });

    // РЕЄСТРАЦІЯ
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirm = document.getElementById('register-confirm').value;

            if (password !== confirm) {
                alert("Паролі не збігаються!");
                return;
            }

            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: { display_name: name }
                }
            });

            if (error) alert("Помилка реєстрації: " + error.message);
            else alert("Реєстрація успішна! Перевірте пошту для підтвердження.");
        });
    }

    // ВХІД 
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) alert("Помилка входу: " + error.message);
            else {alert(`Вітаємо ${data.user.user_metadata.display_name}, ви увійшли!`);
                  window.location.href = "dashboard.html";
            } 
        });
    }

    // НЕМАЄ АКАУНТА? / УЖЕ МАЄТЕ АКАУНТ? 
    const alreadyLink = document.getElementById('already-account-link');
    if (alreadyLink) {
        alreadyLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('.tab[data-tab="login"]').click();
        });
    }
    const noneAccountLink = document.getElementById('none-account-link');
    if (noneAccountLink) {
        noneAccountLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('.tab[data-tab="register"]').click();
        });
    }

    //ВИХІД З АКАУНТА
const logOut = document.getElementById('logout-btn')
if(logOut) {
    logOut.addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) {
        alert("Помилка при виході: " + error.message);
         } else {
        window.location.href = 'index.html';
    }
});
}

// ПАРАЛАКС ЕФЕКТ
window.addEventListener('scroll', () => {
    const mainH1 = document.querySelector('.main-section h1');
    const mainP = document.querySelector('.main-section p');
    
    if (mainH1) {
        mainH1.style.transform = `translateX(-${window.scrollY * 0.8}px)`;
    }
    if (mainP) {
        mainP.style.transform = `translateX(${window.scrollY * 0.8}px)`;
    }
});

const mouseParalax = document.querySelectorAll('img');

mouseParalax.forEach((img) => {
    img.addEventListener('mousemove', (e) => {
        const rect = img.getBoundingClientRect();
      
        const x = e.clientX - rect.left; 
        const y = e.clientY - rect.top;
      
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
     
        const rotateX = (centerY - y) / 10; 
        const rotateY = (x - centerX) / 10;

        img.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
})

mouseParalax.forEach((img) => {
    img.addEventListener('mouseleave', () => {
        img.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    });
})

// DASHBOARD НАВІГАЦІЯ
const dashboardNavs = document.querySelectorAll('.dashboard-nav');
const dashboardContents = document.querySelectorAll('.dashboard-content');

dashboardNavs.forEach(nav => {
    nav.addEventListener('click', () => {
        const targetPage = nav.dataset.page;
        
        // Видаляємо активний клас зі всіх навігаційних елементів та контенту
        dashboardNavs.forEach(n => n.classList.remove('active'));
        dashboardContents.forEach(c => c.classList.remove('active'));
        
        // Додаємо активний клас до вибраних елементів
        nav.classList.add('active');
        const activeContent = document.querySelector(`.dashboard-content[data-content="${targetPage}"]`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    });
});

// ЗАВАНТАЖЕННЯ ДАНИХ КОРИСТУВАЧА В НАЛАШТУВАННЯХ
const loadUserData = async () => {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (session) {
        const userNameInput = document.getElementById('user-name');
        const userEmailInput = document.getElementById('user-email');
        const themeSelect = document.getElementById('theme-select');
        
        if (userNameInput) {
            userNameInput.value = session.user.user_metadata?.display_name || '';
        }
        if (userEmailInput) {
            userEmailInput.value = session.user.email || '';
        }
        if (themeSelect) {
            const savedTheme = localStorage.getItem('theme') || 'light';
            themeSelect.value = savedTheme;
        }
    }
};

// ЗБЕРЕЖЕННЯ ПРОФІЛЯ
const saveProfileBtn = document.getElementById('save-profile-btn');
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
        const newName = document.getElementById('user-name').value;
        
        if (!newName.trim()) {
            alert('Будь ласка, введіть ім\'я');
            return;
        }
        
        const { data, error } = await supabaseClient.auth.updateUser({
            data: { display_name: newName }
        });
        
        if (error) {
            alert('Помилка при оновленні профілю: ' + error.message);
        } else {
            alert('Профіль успішно оновлено!');
        }
    });
}

// ПЕРЕКЛЮЧЕННЯ ТЕМИ В НАЛАШТУВАННЯХ
const themeSelect = document.getElementById('theme-select');
if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
        const newTheme = e.target.value;
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// ОНОВЛЕННЯ ПАРОЛЯ
const updatePasswordBtn = document.getElementById('update-password-btn');
if (updatePasswordBtn) {
    updatePasswordBtn.addEventListener('click', async () => {
        const newPassword = document.getElementById('new-password').value;
        
        if (!newPassword || newPassword.length < 6) {
            alert('Пароль повинен мати мінімум 6 символів');
            return;
        }
        
        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });
        
        if (error) {
            alert('Помилка при оновленні пароля: ' + error.message);
        } else {
            alert('Пароль успішно оновлено!');
            document.getElementById('new-password').value = '';
        }
    });
}

// Завантажуємо дані користувача при завантаженні сторінки
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadUserData);
} else {
    loadUserData();
}


});
