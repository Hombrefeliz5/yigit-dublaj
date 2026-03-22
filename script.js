const peer = new Peer();
let currentConn;
let currentCall;
let mediaRecorder;
let chunks = [];
let timerInterval;
let seconds = 0;
let myUsername = "Anonim";

// 1. GİRİŞ VE USERNAME SİSTEMİ
function checkPass() {
    const user = document.getElementById('userInput').value;
    const pass = document.getElementById('passInput').value;
    
    if(user.length < 2) return alert("Düzgün bir username seç aga!");
    if(pass === "yigit2026") {
        myUsername = user;
        document.getElementById('welcomeText').innerText = "🎙 Hoş Geldin " + myUsername;
        document.getElementById('loginOverlay').style.display = 'none';
    } else {
        alert("Şifre yanlış kral!");
    }
}

// 2. PEER BAĞLANTISI
peer.on('open', (id) => {
    document.getElementById('myIdDisplay').innerText = id;
});

document.getElementById('copyBtn').onclick = () => {
    navigator.clipboard.writeText(document.getElementById('myIdDisplay').innerText);
    alert("ID kopyalandı!");
};

// 3. DM BAŞLATMA VE SESLİ
document.getElementById('callBtn').onclick = () => {
    const rId = document.getElementById('remoteId').value;
    if(!rId) return alert("Bağlanılacak ID lazım!");
    
    currentConn = peer.connect(rId);
    setupChat(currentConn);

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        currentCall = peer.call(rId, stream);
        uiConnect();
        currentCall.on('stream', remoteStream => { playStream(remoteStream); });
    });
};

peer.on('connection', (conn) => {
    currentConn = conn;
    setupChat(currentConn);
    uiConnect();
});

peer.on('call', (call) => {
    currentCall = call;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        call.answer(stream);
        uiConnect();
        call.on('stream', remoteStream => { playStream(remoteStream); });
    });
});

function uiConnect() {
    document.getElementById('callBtn').style.display = 'none';
    document.getElementById('hangupBtn').style.display = 'inline-block';
}

document.getElementById('hangupBtn').onclick = () => { location.reload(); };

// 4. DM KUTUSU (USERNAME DAHİL)
function setupChat(conn) {
    conn.on('data', (data) => { 
        // Gelen veriyi (username:mesaj) şeklinde ayırıyoruz
        const parts = data.split("||");
        addMessage(parts[0], parts[1]); 
    });
}

document.getElementById('sendBtn').onclick = () => {
    const msg = document.getElementById('msgInput').value;
    if(msg && currentConn) {
        // Mesajı kullanıcı adınla beraber gönderiyoruz
        currentConn.send(myUsername + "||" + msg);
        addMessage("Sen", msg);
        document.getElementById('msgInput').value = "";
    }
};

function addMessage(sender, text) {
    const box = document.getElementById('chatBox');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg';
    msgDiv.innerHTML = `<span class="user-tag">${sender}</span>${text}`;
    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight;
}

function playStream(stream) {
    const audio = new Audio();
    audio.srcObject = stream;
    audio.play();
}

// 5. KRONOMETRE VE KAYIT
function updateTimer() {
    seconds++;
    let mins = Math.floor(seconds / 60);
    let secs = seconds % 60;
    document.getElementById('recordTimer').innerText = 
        (mins < 10 ? "0" + mins : mins) + ":" + (secs < 10 ? "0" + secs : secs);
}

document.getElementById('start').onclick = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    seconds = 0;
    document.getElementById('recordTimer').innerText = "00:00";
    timerInterval = setInterval(updateTimer, 1000);
    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = () => {
        clearInterval(timerInterval);
        const blob = new Blob(chunks, { type: 'audio/ogg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.controls = true;
        document.getElementById('audioArea').innerHTML = '';
        document.getElementById('audioArea').appendChild(audio);
        chunks = [];
    };
    mediaRecorder.start();
    document.getElementById('start').disabled = true;
    document.getElementById('stop').disabled = false;
};

document.getElementById('stop').onclick = () => {
    mediaRecorder.stop();
    clearInterval(timerInterval);
    document.getElementById('start').disabled = false;
    document.getElementById('stop').disabled = true;
};
