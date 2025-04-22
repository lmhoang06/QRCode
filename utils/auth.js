/**
 * Authentication utilities
 */

// API base URL
// const API_BASE_URL = 'https://guides.viegrand.site/api2/api';
// const API_BASE_URL = 'http://localhost:5000'; // Local development URL
const API_BASE_URL = 'https://waiedu-backend-a7b30a59c299.herokuapp.com'; // Production URL

// Auth constants
const AUTH_KEY = 'webqr_auth';
const SESSION_DURATION = 3600000; // 1 hour in milliseconds

// Check if API is available
let useApiAuth = true;

async function checkApiAvailability() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/`);
        return response.ok || response.status === 401; // Consider 401 as available
    } catch (error) {
        console.error("Auth API unavailable:", error);
        return false;
    }
}

// Initialize auth
(async function() {
    useApiAuth = await checkApiAvailability();
    console.log(`Using ${useApiAuth ? 'API' : 'local'} auth`);
})();

// Check if user is logged in
export function checkAuth() {
    try {
        const authData = JSON.parse(localStorage.getItem(AUTH_KEY));
        if (!authData) return false;
        
        // Check if session has expired
        const now = new Date().getTime();
        if (now > authData.expires) {
            logout(); // Clean up expired session
            return false;
        }
        
        // Extend session
        authData.expires = now + SESSION_DURATION;
        localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        
        return true;
    } catch (e) {
        console.error('Auth check error:', e);
        return false;
    }
}

// Login function
export async function login(username, password) {
    if (!useApiAuth) {
        // Fallback to local authentication
        if (username === 'admin' && password === '123') {
            const now = new Date().getTime();
            const authData = {
                username: username,
                expires: now + SESSION_DURATION
            };
            
            localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
            return true;
        }
        return false;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            return false;
        }
        
        const result = await response.json();
        
        if (!result.success) {
            return false;
        }
        
        // Save session data
        localStorage.setItem(AUTH_KEY, JSON.stringify(result.session));
        
        return true;
    } catch (error) {
        console.error("API login error:", error);
        
        // Fall back to local authentication if API fails
        if (username === 'admin' && password === '123') {
            const now = new Date().getTime();
            const authData = {
                username: username,
                expires: now + SESSION_DURATION
            };
            
            localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
            return true;
        }
        
        return false;
    }
}

// Logout function
export function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'login.html';
}

// Get current user info
export function getCurrentUser() {
    try {
        const authData = JSON.parse(localStorage.getItem(AUTH_KEY));
        return authData ? authData.username : null;
    } catch (e) {
        return null;
    }
}

// Require authentication for protected pages
export function requireAuth() {
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}
