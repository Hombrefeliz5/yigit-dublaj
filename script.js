let mediaRecorder;
let chunks = [];
const peer = new Peer(); 
let currentConn;

peer.on('open', (id) => {
    document.getElementById('myIdDisplay').innerText = id;
});

document.getElementById('copyBtn').onclick = () => {
    navigator.clipboard.writeText(document.getElementById('myIdDisplay').innerText);
    alert("Kopyalandı reis!");
};

document.getElementById('start').onclick = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = () => {
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
    document.getElementById('start').disabled = false;
    document.getElementById('stop').disabled = true;
};

document.getElementById('callBtn').onclick = () => {
    const rId = document.getElementById('remoteId').value;
    if(!rId) return alert("ID gir aga!");
    currentConn = peer.connect(rId);
    setupChat(currentConn);
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const call = peer.call(rId, stream);
        call.on('stream', remoteStream => { playStream(remoteStream); });
    });
};

peer.on('connection', (conn) => {
    currentConn = conn;
    setupChat(currentConn);
});

peer.on('call', (call) => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        call.answer(stream);
        call.on('stream', remoteStream => { playStream(remoteStream); });
    });
});

function setupChat(conn) {
    conn.on('data', (data) => { addMessage("Karşı Taraf", data); });
}

document.getElementById('sendBtn').onclick = () => {
    const msg = document.getElementById('msgInput').value;
    if(msg && currentConn) {
        currentConn.send(msg);
        addMessage("Sen", msg);
        document.getElementById('msgInput').value = "";
    } else { alert("Önce bağlanman lazım reis!"); }
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