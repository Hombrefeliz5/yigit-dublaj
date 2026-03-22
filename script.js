const peer = new Peer();
let currentConn;
let currentCall;
let mediaRecorder;
let chunks = [];
let timerInterval;
let seconds = 0;

// 1. ŞİFRE SİSTEMİ (Şifre: yigit2026)
function checkPass() {
    const pass = document.getElementById('passInput').value;
    if(pass === "yigit2026") {
        document.getElementById('loginOverlay').style.display = 'none';
    } else {
        alert("Yanlış şifre reis, giremezsin!");
    }
}

// 2. PEER BAĞLANTISI (ID ALMA)
peer.on('open', (id) => {
    document.getElementById('myIdDisplay').innerText = id;
});

document.getElementById('copyBtn').onclick = () => {
    navigator.clipboard.writeText(document.getElementById('myIdDisplay').innerText);
    alert("ID kopyalandı, karşı tarafa atabilirsin!");
};

// 3. ARAMA VE SESLİ SOHBET
document.getElementById('callBtn').onclick = () => {
    const rId = document.getElementById('remoteId').value;
    if(!rId) return alert("Önce bir ID girmelisin aga!");
    
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

document.getElementById('hangupBtn').onclick = () => {
    location.reload(); // En temiz kapatma yolu
};

// 4. MESAJLAŞMA
function setupChat(conn) {
    conn.on('data', (data) => { addMessage("Karşı Taraf", data); });
}

document.getElementById('sendBtn').onclick = () => {
    const msg = document.getElementById('msgInput').value;
    if(msg && currentConn) {
        currentConn.send(msg);
        addMessage("Sen", msg);
        document.getElementById('msgInput').value = "";
    }
};

function addMessage(sender, text) {
    const box = document.getElementById('chatBox');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg';
    msgDiv.innerHTML = `<b>${sender}:</b> ${text}`;
    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight;
}

function playStream(stream) {
    const audio = new Audio();
    audio.srcObject = stream;
    audio.play();
}

// 5. ÖDEV KAYDI VE KRONOMETRE
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
