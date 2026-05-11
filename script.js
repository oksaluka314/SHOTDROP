const supabaseUrl = 'https://tkmsvdavwtykvqvidozy.supabase.co'; 
const supabaseKey = 'sb_publishable_Kgilulrm6Dkw9bD9WVjjEg_0nLwl1Qz';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
  
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

    // === ПЕРЕМИКАННЯ ТАБІВ (Login/Register) ===
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

    // === РЕЄСТРАЦІЯ ===
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

    // === ВХІД ===
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
            else {alert("Вітаємо, ви увійшли!");
                  window.location.href = "dashboard.html";
            } 
        });
    }

    // Допоміжні посилання (наприклад, "Уже маєте акаунт?")
    const alreadyLink = document.getElementById('already-account-link');
    if (alreadyLink) {
        alreadyLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('.tab[data-tab="login"]').click();
        });
    }
});