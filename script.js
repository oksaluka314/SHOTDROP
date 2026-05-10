// ЗМІНА ТЕМИ
const updateThemeButton = () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const btnTheme = document.getElementById('theme-toggle');
  btnTheme.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
};

const toggleTheme = () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme); 
  updateThemeButton(); 
};

const btnTheme = document.getElementById('theme-toggle');
btnTheme.addEventListener('click', toggleTheme);
updateThemeButton(); 
//========================================================================
   // --- ОБРОБКА ВХОДУ ---
const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const data = { email, password };

    try {
        const response = await fetch('/api/login', { // Шлях до вашого ендпоїнту на сервері
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data) // Перетворюємо об'єкт у JSON-рядок
        });

        const result = await response.json();

        if (response.ok) {
            alert('Вхід успішний!');
            // Тут можна перенаправити користувача на іншу сторінку
        } else {
            alert('Помилка: ' + result.message);
        }
    } catch (error) {
        console.error('Помилка мережі:', error);
    }
});

// --- ОБРОБКА РЕЄСТРАЦІЇ ---
const registerForm = document.getElementById('register-form');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;

    if (password !== confirmPassword) {
        alert('Паролі не збігаються!');
        return;
    }

    const data = { name, email, password };

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Реєстрація успішна! Тепер ви можете увійти.');
            // Можна автоматично перемкнути на таб входу
            document.querySelector('.tab[data-tab="login"]').click();
        } else {
            const errorData = await response.json();
            alert('Помилка реєстрації: ' + errorData.message);
        }
    } catch (error) {
        alert('Не вдалося з’єднатися з сервером');
    }
});
