let mediaRecorder;
let chunks = [];

// SES KAYDETME BÖLÜMÜ
document.getElementById('start').onclick = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
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

// CANLI SOHBET BÖLÜMÜ (PeerJS)
const peer = new Peer(); 

peer.on('open', id => {
    console.log('Senin ID numaran: ' + id);
    alert('Senin ID numaran: ' + id + '\nBu numarayı hocaya veya öğrenciye ver!');
});

document.getElementById('callBtn').onclick = () => {
    const rId = document.getElementById('remoteId').value;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const call = peer.call(rId, stream);
        call.on('stream', remoteStream => {
            const audio = new Audio();
            audio.srcObject = remoteStream;
            audio.play();
        });
    });
};

peer.on('call', call => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        call.answer(stream);
        call.on('stream', remoteStream => {
            const audio = new Audio();
            audio.srcObject = remoteStream;
            audio.play();
        });
    });
});
