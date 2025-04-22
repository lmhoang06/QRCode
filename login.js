import { login, checkAuth } from './utils/auth.js';
import { Notification } from './components/notification.js';

document.addEventListener('DOMContentLoaded', () => {
    // Đã đăng nhập rồi thì chuyển sang trang chính
    if (checkAuth()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Elements
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    
    // Initialize notification
    const notification = new Notification();
    notification.init();
    
    // Focus đầu tiên vào ô username
    usernameInput.focus();
    
    // Login function
    async function handleLogin() {
        // Hide error message
        loginError.classList.add('hidden');
        
        // Get values
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        // Validate input
        if (!username || !password) {
            showError('Vui lòng nhập đầy đủ thông tin đăng nhập');
            return;
        }
        
        // Try to login
        const success = await login(username, password);
        
        if (success) {
            notification.success('Đăng nhập thành công!');
            
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 500);
        } else {
            showError('Tên đăng nhập hoặc mật khẩu không đúng');
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
    
    // Show error message
    function showError(message) {
        loginError.textContent = message;
        loginError.classList.remove('hidden');
        // Thêm hiệu ứng shake khi lỗi
        loginError.classList.add('shake');
        setTimeout(() => {
            loginError.classList.remove('shake');
        }, 500);
    }
    
    // Event listeners
    loginBtn.addEventListener('click', handleLogin);
    
    // Enter key in password field triggers login
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    // Enter key in username field moves to password
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    });
});
