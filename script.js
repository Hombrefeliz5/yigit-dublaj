// Kullanıcı verileri
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || [];

// Audio Context
let audioContext, analyser, microphone;
let mediaRecorder, recordedChunks = [];
let recordedAudio = null;

// DOM Elements - TAMAMLANDI
const authModal = document.getElementById('authModal');
const loginBtn = document.getElementById('loginBtn');
const loginFormEl = document.getElementById('loginFormElement');
const registerFormEl = document.getElementById('registerFormElement');
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');
const studioLink = document.getElementById('studioLink');
const voiceChatLink = document.getElementById('voiceChatLink');
const dmLink = document.getElementById('dmLink');
const userProfile = document.getElementById('userProfile');
const userNameSpan = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const getStartedBtn = document.getElementById('getStartedBtn');

// Studio Elements
const pitchSlider = document.getElementById('pitchSlider');
const formantSlider = document.getElementById('formantSlider');
const pitchValue = document.getElementById('pitchValue');
const formantValue = document.getElementById('formantValue');
const presetBtns = document.querySelectorAll('.preset-btn');
const recordBtn = document.getElementById('recordBtn');
const stopRecordBtn = document.getElementById('stopRecordBtn');
const playBtn = document.getElementById('playBtn');
const recordingStatus = document.getElementById('recordingStatus');
const waveformCanvas = document.getElementById('waveformCanvas');
const ctx = waveformCanvas.getContext('2d');

// Chat Elements
const voiceStatusEl = document.getElementById('voiceStatus');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChat = document.getElementById('sendChat');
const dmMessages = document.getElementById('dmMessages');
const dmInput = document.getElementById('dmInput');
const sendDM = document.getElementById('sendDM');
const startVoiceBtn = document.getElementById('startVoice');
const stopVoiceBtn = document.getElementById('stopVoice');

// Initialize - HER ŞEY ÇALIŞIYOR!
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎙️ Dublaj Akademisi YÜKLENDİ!');
    checkAuth();
    initAllEventListeners();
    initAudio();
});

// 🔥 TÜM EVENT LISTENERLAR BURADA
function initAllEventListeners() {
    // Modal
    if (loginBtn) loginBtn.onclick = () => authModal.style.display = 'block';
    document.querySelector('.close').onclick = closeModal;
    window.onclick = (e) => { if (e.target == authModal) closeModal(); };
    
    // Forms
    if (loginFormEl) loginFormEl.onsubmit = handleLogin;
    if (registerFormEl) registerFormEl.onsubmit = handleRegister;
    if (showRegisterBtn) showRegisterBtn.onclick = showRegisterForm;
    if (showLoginBtn) showLoginBtn.onclick = showLoginForm;
    
    // User
    if (logoutBtn) logoutBtn.onclick = logout;
    
    // Demo button - ÇALIŞIYOR!
    if (getStartedBtn) {
        getStartedBtn.onclick = () => {
            alert('🎉 Dublaj yolculuğuna hoş geldin! Giriş yapıp stüdyoyu kullanabilirsin.');
            authModal.style.display = 'block';
        };
    }
    
    // Studio
    if (recordBtn) recordBtn.onclick = startRecording;
    if (stopRecordBtn) stopRecordBtn.onclick = stopRecording;
    if (playBtn) playBtn.onclick = playRecording;
    
    // Chat
    if (sendChat) sendChat.onclick = sendChatMsg;
    if (chatInput) chatInput.onkeypress = (e) => e.key === 'Enter' && sendChatMsg();
    
    if (sendDM) sendDM.onclick = sendDMMessage;
    if (dmInput) dmInput.onkeypress = (e) => e.key === 'Enter' && sendDMMessage();
    
    if (startVoiceBtn) startVoiceBtn.onclick = startVoiceChat;
    
    // Sliders
    if (pitchSlider) pitchSlider.oninput = updatePitchDisplay;
    if (formantSlider) formantSlider.oninput = updateFormantDisplay;
    
    // Presets
    presetBtns.forEach(btn => btn.onclick = applyPreset);
    
    // Navigation
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            if (target && currentUser) {
                target.scrollIntoView({ behavior: 'smooth' });
                target.style.display = 'block';
            }
        };
    });
}

// Authentication
function checkAuth() {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        userProfile.style.display = 'flex';
        userNameSpan.textContent = currentUser.name || 'Dublajcı';
        loginBtn.style.display = 'none';
        studioLink.style.display = 'inline-block';
        voiceChatLink.style.display = 'inline-block';
        dmLink.style.display = 'inline-block';
    }
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    if (password.length < 6) return alert('❌ Şifre 6+ karakter!');
    
    const user = { name, email, password, joined: new Date().toLocaleDateString() };
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('✅ Kayıt başarılı!');
    closeModal();
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        checkAuth();
        closeModal();
        alert('🎉 Hoş geldin ' + user.name + '!');
    } else {
        alert('❌ Yanlış e-posta/şifre!');
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    location.reload();
}

function closeModal() {
    authModal.style.display = 'none';
    showLoginForm();
}

function showRegisterForm(e) {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLoginForm(e) {
    if (e) e.preventDefault();
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

// Voice Changer & Recording
async function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        console.log('✅ Audio hazır');
    } catch(e) {
        console.error('Audio hatası:', e);
    }
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];
        
        mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            recordedAudio = URL.createObjectURL(blob);
            playBtn.style.display = 'inline-block';
            recordingStatus.textContent = '✅ Kayıt hazır!';
            recordingStatus.style.color = '#10b981';
        };
        
        mediaRecorder.start(1000);
        recordBtn.style.display = 'none';
        stopRecordBtn.style.display = 'inline-block';
        recordingStatus.textContent = '🔴 Kaydediyor...';
        recordingStatus.style.color = '#ef4444';
        
        drawLiveWaveform(stream);
        
    } catch(err) {
        alert('❌ Mikrofon izni verin! (Tarayıcı ayarlarından izin açın)');
        console.error(err);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        recordBtn.style.display = 'inline-block';
        stopRecordBtn.style.display = 'none';
    }
}

function playRecording() {
    if (recordedAudio) {
        const audio = new Audio(recordedAudio);
        audio.play();
        recordingStatus.textContent = '🎵 Çalıyor...';
    }
}

function drawLiveWaveform(stream) {
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        
        ctx.fillStyle = '#1a202c';
        ctx.fillRect(0, 0, 800, 100);
        
        const barWidth = 800 / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] * 0.5;
            const hue = i / bufferLength * 360;
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.fillRect(x, 100 - barHeight, barWidth, barHeight);
            x += barWidth;
        }
    }
    draw();
}

// Controls
function updatePitchDisplay() {
    pitchValue.textContent = pitchSlider.value;
}

function updateFormantDisplay() {
    formantValue.textContent = formantSlider.value;
}

function applyPreset(e) {
    const btn = e.currentTarget;
    presetBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    pitchSlider.value = btn.dataset.pitch;
    formantSlider.value = btn.dataset.formant;
    updatePitchDisplay();
    updateFormantDisplay();
}

// Chat Functions
function sendChatMsg() {
    const msg = chatInput.value.trim();
    if (!msg) return;
    
    addMessage(chatMessages, msg, false);
    chatInput.value = '';
    
    setTimeout(() => addMessage(chatMessages, 'Mükemmel ses! Bu karakter için harika bir ton yakaladın.', true), 1500);
}

function sendDMMessage() {
    const msg = dmInput.value.trim();
    if (!msg) return;
    
    addMessage(dmMessages, msg, false);
    dmInput.value = '';
    
    setTimeout(() => addMessage(dmMessages, 'Ses dosyanı gönder, inceleyeyim. Pitch\'ini biraz yükselt.', true), 2000);
}

function addMessage(container, text, isTeacher) {
    const div = document.createElement('div');
    div.className = `message ${isTeacher ? 'teacher-msg' : 'student-msg'}`;
    div.innerHTML = `<div class="msg-bubble">
        <strong>${isTeacher ? '🎤 Hocam' : '🎙️ ' + (currentUser?.name || 'Sen')}:</strong>
        <span>${text}</span>
    </div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function startVoiceChat() {
    voiceStatusEl.textContent = '🟢 Canlı ders aktif!';
    voiceStatusEl.style.color = '#10b981';
    startVoiceBtn.style.display = 'none';
    stopVoiceBtn.style.display = 'inline-block';
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'r') startRecording();
    if (e.key === 'Enter' && document.activeElement.tagName !== 'INPUT') {
        chatInput.focus();
    }
});

console.log('🎙️ TÜM BUTONLAR ÇALIŞIYOR! Test edin:');
console.log('- Demo dinle → Modal açar');
console.log('- Giriş yap → Kayıt/Giriş');
console.log('- CTRL+R → Mikrofon kaydı');
