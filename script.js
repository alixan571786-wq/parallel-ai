// 1. Firebase Sozlamalari
const firebaseConfig = {
    apiKey: "AIzaSyCz9K4Syvf5hCvAcLf72P36E_Gzzb7ptec",
    authDomain: "parallel-ai-9b5ee.firebaseapp.com",
    projectId: "parallel-ai-9b5ee",
    storageBucket: "parallel-ai-9b5ee.firebasestorage.app",
    messagingSenderId: "353629717467",
    appId: "1:353629717467:web:6a18685214447d99655dfe",
    measurementId: "G-YL2Y348F89"
};

// Firebase-ni ishga tushirish
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const API_KEY = "AIzaSyBRwjd4IJqOTpHgKEPOoFi98Y_wclKoBrM";
const MODEL_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

let user = null;
let chatHistory = [];

window.onload = () => {
    setTimeout(() => {
        document.getElementById('splash').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('splash').style.display = 'none';
            checkUserData();
        }, 800);
    }, 2000);
};

function checkUserData() {
    const savedUser = localStorage.getItem('parallel_v7_profile');
    if (savedUser) {
        user = JSON.parse(savedUser);
        startApp();
        loadChatFromFirebase();
    } else {
        document.getElementById('auth-screen').classList.remove('hidden');
    }
}

document.getElementById('start-btn').onclick = () => {
    const name = document.getElementById('user-name').value.trim();
    const age = document.getElementById('user-age').value.trim();
    if (!name || !age) return alert("Ma'lumotlarni kiriting!");
    
    user = { name, age, id: name.toLowerCase() + "_" + Math.floor(Math.random() * 1000) };
    localStorage.setItem('parallel_v7_profile', JSON.stringify(user));
    startApp();
};

function startApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.remove('hidden');
    document.getElementById('display-name').innerText = user.name;
}

// Firebase-dan xabarlarni yuklash
function loadChatFromFirebase() {
    const chatRef = db.ref('chats/' + user.id);
    chatRef.on('value', (snapshot) => {
        const data = snapshot.val();
        const content = document.getElementById('chat-content');
        content.innerHTML = "";
        chatHistory = [];
        
        if (data) {
            Object.values(data).forEach(msg => {
                chatHistory.push(msg);
                renderMsg(msg.role, msg.text);
            });
        } else {
            addAndSaveMsg('ai', `Salom ${user.name}. Men sening parallel aksingman.`);
        }
    });
}

async function sendMessage() {
    const input = document.getElementById('user-msg');
    const text = input.value.trim();
    if (!text) return;

    addAndSaveMsg('user', text);
    input.value = "";
    document.getElementById('typing').classList.remove('hidden');

    const prompt = `Foydalanuvchi: ${user.name}, Yoshi: ${user.age}. Sen uning parallel dunyodagi egizagisan.`;
    
    try {
        const resp = await fetch(MODEL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: `${prompt}\n\nXabar: ${text}` }] }] })
        });
        const data = await resp.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        document.getElementById('typing').classList.add('hidden');
        addAndSaveMsg('ai', aiResponse);
    } catch (e) {
        document.getElementById('typing').classList.add('hidden');
        console.error("Xato yuz berdi");
    }
}

function addAndSaveMsg(role, text) {
    db.ref('chats/' + user.id).push({
        role: role,
        text: text,
        time: Date.now()
    });
}

function renderMsg(role, text) {
    const content = document.getElementById('chat-content');
    const div = document.createElement('div');
    div.className = `msg ${role}-msg`;
    div.innerText = text;
    content.appendChild(div);
    content.scrollTop = content.scrollHeight;
}

document.getElementById('send-btn').onclick = sendMessage;
document.getElementById('user-msg').onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
document.getElementById('back-to-auth').onclick = () => { localStorage.clear(); location.reload(); };
