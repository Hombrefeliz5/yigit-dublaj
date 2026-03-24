// Kullanıcı verileri
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || [];

// Audio Context for voice changer
let audioContext;
let mediaStreamSource;
let voiceEffectNode;
let analyser;
let microphone;

// DOM Elements
const authModal = document.getElementById('authModal');
const loginBtn = document.getElementById('loginBtn');
const loginForm = document.getElementById('loginFormElement');
const registerForm = document.getElementById('registerFormElement');
const studioLink = document.getElementById('studioLink');
const voiceChatLink = document.getElementById('voiceChatLink');
const dmLink = document.getElementById('dmLink');
const userProfile = document.getElementById('userProfile');
const userNameSpan = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');

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
const voiceStatus = document.getElementById('voiceStatus');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChat = document.getElementById('sendChat');
const dmMessages = document.getElementById('dmMessages');
const dmInput = document.getElementById('dmInput');
const sendDM = document.getElementById('sendDM');

// Audio chunks for recording
let mediaRecorder;
let recordedChunks = [];
let recordedAudio = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initEventListeners();
    initAudioContext();
});

// Authentication Functions
function checkAuth() {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        showUserUI();
    }
}

function showUserUI() {
    loginBtn.style.display = 'none';
    userProfile.style.display = 'flex';
    userNameSpan.textContent = currentUser.name;
    studioLink.style.display = 'block';
    voiceChatLink.style.display = 'block';
    dmLink.style.display = 'block';
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    if (password.length < 6) {
        alert('Şifre en az 6 karakter olmalı!');
        return;
    }

    const user = { name, email, password };
    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('Kayıt başarılı! Giriş yapabilirsiniz.');
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
        showUserUI();
        closeModal();
        alert('Giriş başarılı!');
    } else {
        alert('E-posta veya şifre hatalı!');
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    loginBtn.style.display = 'block';
    userProfile.style.display = 'none';
    studioLink.style.display = 'none';
    voiceChatLink.style.display = 'none';
    dmLink.style.display = 'none';
    document.getElementById('studio').style.display = 'none';
    document.getElementById('voice-chat').style.display = 'none';
    document.getElementById('dm').style.display = 'none';
}

// Modal Controls
function closeModal() {
    authModal.style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

// Audio Context & Voice Changer
async function initAudioContext() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        console.log('Audio context initialized');
    } catch (err) {
        console.error('Audio context error:', err);
    }
}

function applyVoiceEffect(stream) {
    mediaStreamSource = audioContext.createMediaStreamSource(stream);
    
    // Pitch shift node (simplified)
    voiceEffectNode = audioContext.createBiquadFilter();
    voiceEffectNode.type = 'allpass';
    
    mediaStreamSource.connect(voiceEffectNode);
    voiceEffectNode.connect(analyser);
    analyser.connect(audioContext.destination);
    
    updateVoiceEffect();
}

function updateVoiceEffect() {
    if (voiceEffectNode) {
        const pitch = parseInt(pitchSlider.value);
        const formant = parseInt(formantSlider.value);
        
        // Simulate pitch shift with filter
        voiceEffectNode.frequency.setValueAtTime(200 + Math.abs(pitch) * 10, audioContext.currentTime);
        voiceEffectNode.Q.setValueAtTime(1 + Math.abs(formant) * 0.1, audioContext.currentTime);
    }
}

// Recording Functions
recordBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        applyVoiceEffect(stream);
        
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) recordedChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            recordedAudio = URL.createObjectURL(blob);
            playBtn.style.display = 'block';
            recordingStatus.textContent = 'Kayıt tamamlandı!';
            recordBtn.style.display = 'none';
            stopRecordBtn.style.display = 'none';
            visualizeAudio(blob);
        };
        
        mediaRecorder.start();
        recordBtn.style.display = 'none';
        stopRecordBtn.style.display = 'inline-block';
        recordingStatus.textContent = 'Kayıt yapılıyor...';
        recordingStatus.style.color = '#ef4444';
        
        // Real-time visualization
        drawWaveform();
        
    } catch (err) {
        alert('Mikrofon erişimi reddedildi!');
        console.error(err);
    }
});

stopRecordBtn.addEventListener('click', () => {
    mediaRecorder.stop();
    microphone.getTracks().forEach(track => track.stop());
});

playBtn.addEventListener('click', () => {
    const audio = new Audio(recordedAudio);
    audio.play();
    recordingStatus.textContent = 'Ses oynatılıyor...';
});

function visualizeAudio(blob) {
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    const audioContextVis = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContextVis.createMediaElementSource(audio);
    const analyserVis = audioContextVis.createAnalyser();
    
    source.connect(analyserVis);
    analyserVis.connect(audioContextVis.destination);
    
    // Draw static waveform
    const bufferLength = analyserVis.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        analyserVis.getByteFrequencyData(dataArray);
        ctx.fillStyle = 'rgb(26, 32, 44)';
        ctx.fillRect(0, 0, 800, 100);
        
        const barWidth = (800 / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            ctx.fillStyle = `rgb(${barHeight + 100}, 50, 150)`;
            ctx.fillRect(x, 100 - barHeight / 2, barWidth, barHeight / 2);
            x += barWidth + 1;
        }
    }
    
    audio.play();
    const rafId = requestAnimationFrame(draw);
    audio.onended = () => cancelAnimationFrame(rafId);
}

function drawWaveform() {
    if (!analyser) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        
        ctx.fillStyle = 'rgb(26, 32, 44)';
        ctx.fillRect(0, 0, 800, 100);
        
        const barWidth = (800 / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] * 0.8;
            const hue = i / bufferLength * 360;
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.fillRect(x, 100 - barHeight / 2, barWidth, barHeight / 2);
            x += barWidth + 1;
        }
    }
    draw();
}

// Voice Changer Controls
pitchSlider.addEventListener('input', (e) => {
    pitchValue.textContent = e.target.value;
    updateVoiceEffect();
});

formantSlider.addEventListener('input', (e) => {
    formantValue.textContent = e.target.value;
    updateVoiceEffect();
});

presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const pitch = parseInt(btn.dataset.pitch);
        const formant = parseInt(btn.dataset.formant);
        
        pitchSlider.value = pitch;
        formantSlider.value = formant;
        pitchValue.textContent = pitch;
        formantValue.textContent = formant;
        updateVoiceEffect();
    });
});

// Chat Functions
function addChatMessage(message, isTeacher = false) {
    const div = document.createElement('div');
    div.className = `chat-message ${isTeacher ? 'teacher' : 'student'}`;
    div.innerHTML = `<strong>${isTeacher ? 'Hoca' : currentUser.name}:</strong> ${message}`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendChat.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
        addChatMessage(message);
        chatInput.value = '';
        
        // Simulate teacher response
        setTimeout(() => {
            addChatMessage('Harika ses! Nefes kontrolünü geliştir, daha da iyi olacak.', true);
        }, 2000);
    }
});

// DM Functions
function addDMMessage(message, isTeacher = false) {
    const div = document.createElement('div');
    div.className = `dm-message ${isTeacher ? 'teacher' : 'student'}`;
    div.innerHTML = `<strong>${isTeacher ? 'Hocam' : currentUser.name}:</strong> ${message}`;
    dmMessages.appendChild(div);
    dmMessages.scrollTop = dmMessages.scrollHeight;
}

sendDM.addEventListener('click', () => {
    const message = dmInput.value.trim();
    if (message) {
        addDMMessage(message);
        dmInput.value = '';
        
        // Auto-reply from teacher
        setTimeout(() => {
            addDMMessage('Bu konuda birebir özel ders vereyim mi? Ses örneğini gönder.', true);
        }, 1500);
    }
});

document.querySelectorAll('.contact').forEach(contact => {
    contact.addEventListener('click', () => {
        document.querySelectorAll('.contact').forEach(c => c.classList.remove('active'));
        contact.classList.add('active');
    });
});

// Navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            if (currentUser) {
                target.style.display = 'block';
            }
        }
    });
});

// Event Listeners
function initEventListeners() {
    loginBtn.addEventListener('click', () => authModal.style.display = 'block');
    document.querySelector('.close').addEventListener('click', closeModal);
    logoutBtn.addEventListener('click', logout);
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        showRegister();
    });
    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        showLogin();
    });
    
    // Voice chat
    document.getElementById('startVoice').addEventListener('click', () => {
        voiceStatus.textContent = 'Canlı ders aktif!';
        voiceStatus.style.color = '#10b981';
    });
}

// Smooth scrolling for sections
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);
        
        if (targetSection && currentUser) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
            targetSection.style.display = 'block';
        }
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'r' && currentUser) {
        recordBtn.click();
    }
    if (e.key === 'Enter' && document.activeElement === chatInput) {
        sendChat.click();
    }
    if (e.key === 'Enter' && document.activeElement === dmInput) {
        sendDM.click();
    }
});

console.log('🎙️ Dublaj Akademisi hazır! Mikrofon izni ver ve stüdyoyu dene.');
