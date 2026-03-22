// --- SİZİN FİREBASE YAPILANDIRMANIZ ---
const firebaseConfig = {
  apiKey: "AIzaSyCIaWsssgTr_G7pCElg1G5b4k4Ma9GvGLo",
  authDomain: "yigitdublaj-87d7c.firebaseapp.com",
  projectId: "yigitdublaj-87d7c",
  storageBucket: "yigitdublaj-87d7c.firebasestorage.app",
  messagingSenderId: "12986940740",
  appId: "1:12986940740:web:b3966a6ea820b3f0816b11",
  measurementId: "G-ECM0T14X1J"
};

// Firebase Başlat
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let isLoginMode = true;
let currentUser = null;
const peer = new Peer();
let currentConn;

// --- ÜYELİK SİSTEMİ (GERÇEK VERİTABANI) ---
function toggleAuth() {
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').innerText = isLoginMode ? "Giriş Yap" : "Kayıt Ol";
    document.getElementById('authBtn').innerText = isLoginMode ? "Giriş Yap" : "Kayıt Ol";
    document.getElementById('toggleBtn').innerText = isLoginMode ? "Hesabın yok mu? Kayıt Ol" : "Zaten hesabın var mı? Giriş Yap";
}

function handleAuth() {
    const user = document.getElementById('userInput').value.trim();
    const pass = document.getElementById('passInput').value.trim();

    if (!user || !pass) return alert("Boş bırakma aga!");

    if (isLoginMode) {
        // GİRİŞ KONTROLÜ
        db.ref('users/' + user).once('value').then((snapshot) => {
            if (snapshot.exists() && snapshot.val().password === pass) {
                loginSuccess(user);
            } else {
                alert("Hatalı kullanıcı adı veya şifre kral!");
            }
        });
    } else {
        // KAYIT KONTROLÜ
        db.ref('users/' + user).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                alert("Bu isim kapılmış, başka dene aga!");
            } else {
                db.ref('users/' + user).set({ password: pass }).then(() => {
                    alert("Kayıt tamam! Şimdi giriş yapabilirsin.");
                    toggleAuth();
                });
            }
        });
    }
}

function loginSuccess(user) {
    currentUser = user;
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'inline-block';
    document.getElementById('welcomeText').innerText = "🎙 Hoş Geldin " + user;
}

// --- PEER & DM SİSTEMİ ---
peer.on('open', (id) => { document.getElementById('myIdDisplay').innerText = id; });

function startCall() {
    const rId = document.getElementById('remoteId').value;
    if(!rId) return alert("ID girmeden bağlanamazsın!");
    currentConn = peer.connect(rId);
    setupChat(currentConn);
    
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const call = peer.call(rId, stream);
        call.on('stream', s => playStream(s));
    });
}

peer.on('connection', c => { currentConn = c; setupChat(c); });
peer.on('call', c => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
        c.answer(s);
        c.on('stream', rs => playStream(rs));
    });
});

function setupChat(c) {
    c.on('data', data => {
        const p = data.split("||");
        addMsg(p[0], p[1]);
    });
}

function sendMessage() {
    const m = document.getElementById('msgInput').value;
    if(m && currentConn) {
        currentConn.send(currentUser + "||" + m);
        addMsg("Sen", m);
        document.getElementById('msgInput').value = "";
    }
}

function addMsg(s, t) {
    const b = document.getElementById('chatBox');
    b.innerHTML += `<div class="msg"><span class="user-tag">${s}</span>${t}</div>`;
    b.scrollTop = b.scrollHeight;
}

function playStream(s) { const a = new Audio(); a.srcObject = s; a.play(); }

// --- KAYIT & KRONOMETRE ---
let timer; let secs = 0; let recorder; let chunks = [];

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
        recorder = new MediaRecorder(s);
        secs = 0; timer = setInterval(() => {
            secs++;
            let m = Math.floor(secs/60); let sc = secs%60;
            document.getElementById('recordTimer').innerText = (m<10?'0'+m:m)+":"+(sc<10?'0'+sc:sc);
        }, 1000);
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            const b = new Blob(chunks, {type:'audio/ogg'});
            const u = URL.createObjectURL(b);
            document.getElementById('audioArea').innerHTML = `<audio controls src="${u}"></audio>`;
            chunks = [];
        };
        recorder.start();
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;
    });
}

function stopRecording() {
    recorder.stop(); clearInterval(timer);
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
}
