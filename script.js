// Kullanıcı verileri (localStorage'da saklanacak)
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || [];

// DOM Elements
const authModal = document.getElementById('authModal');
const loginBtn = document.getElementById('loginBtn');
const loginForm = document.getElementById('loginFormElement');
const registerForm = document.getElementById('registerFormElement');
const chatLink = document.getElementById('chatLink');
const dmLink = document.getElementById('dmLink');
const userProfile = document.getElementById('userProfile');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const voiceStatus = document.getElementById('voiceStatus');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChat = document.getElementById('sendChat');
const dmMessages = document.getElementById('dmMessages');
const dmInput = document.getElementById('dmInput');
const sendDM = document.getElementById('sendDM');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initEventListeners();
});

// Event Listeners
function initEventListeners() {
    // Auth Modal
    loginBtn.addEventListener('click', () => authModal.style.display = 'block');
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === authModal) closeModal();
    });

    document.getElementById('showRegister').addEventListener('click', showRegister);
    document.getElementById('showLogin').addEventListener('click', showLogin);

    // Forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutBtn.addEventListener('click', logout);

    // Chat
    sendChat.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    // DM
    sendDM.addEventListener('click', sendDMMessage);
    dmInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter
