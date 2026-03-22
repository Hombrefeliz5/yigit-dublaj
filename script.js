let isLoginMode = true;
let currentUser = null;
const peer = new Peer();
let currentConn;

// --- ÜYELİK SİSTEMİ (BURASI GÜNCELLENDİ) ---
function toggleAuth() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('authTitle');
    const btn = document.getElementById('authBtn');
    const toggle = document.getElementById('toggleBtn');
    
    if (!isLoginMode) {
        title.innerText = "Kayıt Ol";
        btn.innerText = "Kayıt Ol";
        toggle.innerText = "Zaten hesabın var mı? Giriş Yap";
    } else {
        title.innerText = "Giriş Yap";
        btn.innerText = "Giriş Yap";
        toggle.innerText = "Hesabın yok mu? Kayıt Ol";
    }
}

function handleAuth() {
    const user = document.getElementById('userInput').value.trim();
    const pass = document.getElementById('passInput').value.trim();

    if (user === "" || pass === "") {
        alert("Aga kullanıcı adı veya şifreyi boş bırakma!");
        return;
    }

    // Yerel hafızayı çekiyoruz
    let users = JSON.parse(localStorage.getItem('dublajUsers') || '{}');

    if (isLoginMode) {
        // GİRİŞ MANTIĞI
        if (users[user] && users[user] === pass) {
            loginSuccess(user);
        } else {
            alert("Kullanıcı adı veya şifre yanlış reis! Kayıt oldun mu?");
        }
    } else {
        // KAYIT MANTIĞI
        if (users[user]) {
            alert("Bu kullanıcı adı kapılmış aga, başka bir tane dene.");
        } else {
            users[user] = pass;
            localStorage.setItem('dublajUsers', JSON.stringify(users));
            alert("Kayıt Başarılı! Şimdi giriş yapabilirsin kral.");
            toggleAuth(); // Kayıttan sonra giriş moduna geri döner
        }
    }
}

function loginSuccess(user) {
    currentUser = user;
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'inline-block';
    document.getElementById('welcomeText').innerText = "🎙 Hoş Geldin " + user;
}

// --- PEER & SESLİ SOHBET ---
peer.on('open', (id) => { 
    document.getElementById('myIdDisplay').innerText = id; 
});

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

function playStream(s) { 
    const a = new Audio(); 
    a.srcObject = s; 
    a.play(); 
}

// --- KAYIT & KRONOMETRE ---
