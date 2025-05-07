import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDQRfAZFgZsnyg1DiyZX-se0infwRDWK00",
  authDomain: "doodle-3-14e93.firebaseapp.com",
  projectId: "doodle-3-14e93",
  storageBucket: "doodle-3-14e93.firebasestorage.app",
  messagingSenderId: "975561847283",
  appId: "1:975561847283:web:e41c2b2306c86ce5c4e286",
  measurementId: "G-MYG06JN42L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const sleepRef = collection(db, "sleepData");

let isLoginMode = false;
let currentUser = null;
let formStage = null;
let editingId = null;
let currentIndex = 0;
let interval = null;

const stages = [
  {
    stage: 'Awake',
    value: 'awake',
    bgClass: 'awake-bg',
    emoji: '😀',
    card: {
      title: 'Awake Stage',
      image: 'https://i.imgur.com/pMRxAQR.png',
      text: 'You are alert and aware. This is the stage when you’re falling asleep or waking up.'
    }
  },
  {
    stage: 'Light Sleep',
    value: 'light-sleep',
    bgClass: 'light-sleep-bg',
    emoji: '😪',
    card: {
      title: 'Light Sleep',
      image: 'https://i.imgur.com/9XzHzsA.png',
      text: 'Your body begins to relax, heart rate slows, and your temperature drops slightly.'
    }
  },
  {
    stage: 'Deep Sleep',
    value: 'deep-sleep',
    bgClass: 'deep-sleep-bg',
    emoji: '😴',
    card: {
      title: 'Deep Sleep',
      image: 'https://i.imgur.com/Gpv9DP2.png',
      text: 'This is the most restorative stage. The body repairs itself and boosts immunity.'
    }
  },
  {
    stage: 'Dreaming',
    value: 'dream',
    bgClass: 'dream-bg',
    emoji: '🤩',
    card: {
      title: 'REM Sleep',
      image: 'https://i.imgur.com/jKezCuP.png',
      text: 'Dreams occur during REM sleep. It supports memory and emotional processing.'
    }
  }
];

// DOM elements
const formTitle = document.getElementById("formTitle");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const passwordVerifiedInput = document.getElementById("passwordVerifiedInput");
const repeatPasswordField = document.getElementById("repeatPasswordField");
const passwordMismatch = document.getElementById("passwordMismatch");
const termsCheck = document.getElementById("termsCheck");
const termsUncheckedMsg = document.getElementById("termsUncheckedMsg");
const switchModeLink = document.getElementById("switchModeLink");
const submitBtn = document.getElementById("submitBtn");
const loginCover = document.getElementById("loginCover");
const mainApp = document.getElementById("mainApp");
const googleSignInBtn = document.getElementById("googleSignInBtn");
const logoutBtn = document.getElementById("logoutBtn");
const sleepDataForm = document.getElementById("sleepDataForm");
const sleepTimeInput = document.getElementById("sleepTimeInput");
const turnOversInput = document.getElementById("turnOversInput");
const heartbeatInput = document.getElementById("heartbeatInput");
const recordList = document.getElementById("recordList");
const stageSelect = document.getElementById("stageSelect");
const cardsContainer = document.getElementById("cardsContainer");
const stageName = document.getElementById("stageName");
const player = document.getElementById("player");
const stopSoundBtn = document.getElementById("stopSoundBtn");

const soundMap = {
  rain: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  ocean: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  forest: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  fire: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
};

// Auth handling
function updateFormMode() {
  formTitle.textContent = isLoginMode ? "Login" : "Sign Up";
  submitBtn.textContent = isLoginMode ? "Login" : "Sign Up";
  switchModeLink.textContent = isLoginMode ? "Don’t have an account? Sign Up" : "Already have an account? Log In";
  repeatPasswordField.style.display = isLoginMode ? "none" : "block";
  passwordMismatch.style.display = "none";
  termsUncheckedMsg.style.display = "none";
}

switchModeLink.addEventListener("click", (e) => {
  e.preventDefault();
  isLoginMode = !isLoginMode;
  updateFormMode();
});

submitBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;
  const passwordVerified = passwordVerifiedInput.value;

  if (!isLoginMode && password !== passwordVerified) {
    passwordMismatch.style.display = "block";
    return;
  }

  if (!isLoginMode && !termsCheck.checked) {
    termsUncheckedMsg.style.display = "block";
    return;
  }

  try {
    if (isLoginMode) {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      currentUser = userCredential.user;
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
currentUser = auth.currentUser;
loginCover.style.display = "none";
mainApp.style.display = "block"; 
      emailInput.value = '';
passwordInput.value = '';
passwordVerifiedInput.value = '';
termsCheck.checked = false;
    }
  } catch (error) {
    alert("Auth Error: " + error.message);
  }
});

googleSignInBtn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    currentUser = result.user;
  } catch (error) {
    alert("Google Login failed: " + error.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  loginCover.style.display = "flex";
  mainApp.style.display = "none";
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loginCover.style.display = "none";
    mainApp.style.display = "block";
  } else {
    currentUser = null;
    loginCover.style.display = "flex";
    mainApp.style.display = "none";
  }
});

// Sleep stage cards rendering
function renderCards(selected) {
  cardsContainer.innerHTML = "";
  stages.forEach((stage, index) => {
    const shouldShow = selected === "all" || selected === stage.value || (selected === "default" && index === currentIndex);
    if (shouldShow) {
      const div = document.createElement("div");
      div.className = `stage-block position-${index + 1} hover-wrapper fade-in`;
      div.innerHTML = `
        <div class="sleep-status ${stage.bgClass}">${stage.emoji} ${stage.stage}</div>
        <div class="info-card">
          <img src="${stage.card.image}" class="card-img">
          <div class="card-body">
            <h5 class="card-title">${stage.card.title}</h5>
            <p class="card-text">${stage.card.text}</p>
            <button onclick="selectFormStage('${stage.value}')">Fill ${stage.stage}</button>
          </div>
        </div>
      `;
      cardsContainer.appendChild(div);
    }
  });
}

function selectFormStage(stageValue) {
  formStage = stageValue;
  const stage = stages.find(s => s.value === stageValue);
  stageName.textContent = stage ? stage.stage : "None";
}
window.selectFormStage = selectFormStage;

function startCycle() {
  stopCycle();
  renderCards("default");
  interval = setInterval(() => {
    currentIndex = (currentIndex + 1) % stages.length;
    renderCards("default");
  }, 2000);
}

function stopCycle() {
  clearInterval(interval);
  interval = null;
}

stageSelect.addEventListener("change", () => {
  const selected = stageSelect.value;
  selected === "default" ? startCycle() : stopCycle();
  renderCards(selected);
});

sleepDataForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const timestamp = new Date().toISOString();
  const docId = editingId || timestamp;

  await setDoc(doc(db, "sleepData", docId), {
    sleepTime: sleepTimeInput.value,
    turnOvers: turnOversInput.value,
    heartbeat: heartbeatInput.value,
    submittedAt: timestamp,
    category: formStage || "general"
  });

  alert(editingId ? "Updated!" : "Saved!");
  sleepTimeInput.value = '';
  turnOversInput.value = '';
  heartbeatInput.value = '';
  formStage = null;
  editingId = null;
});

onSnapshot(sleepRef, (snapshot) => {
  recordList.innerHTML = "";
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const li = document.createElement("li");
    li.innerHTML = `🛌 ${data.sleepTime} | 🔄 ${data.turnOvers} | ❤️ ${data.heartbeat} | 🕒 ${data.submittedAt} | 🌙 Stage: ${data.category}
      <button onclick="editRecord('${doc.id}')">Edit</button>
      <button onclick="deleteRecord('${doc.id}')">Delete</button>`;
    recordList.appendChild(li);
  });
});

window.editRecord = async (id) => {
  const docSnap = await getDoc(doc(db, "sleepData", id));
  if (docSnap.exists()) {
    const data = docSnap.data();
    sleepTimeInput.value = data.sleepTime;
    turnOversInput.value = data.turnOvers;
    heartbeatInput.value = data.heartbeat;
    formStage = data.category;
    editingId = id;
    stageName.textContent = stages.find(s => s.value === data.category)?.stage || "Unknown";
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
  }
};

window.deleteRecord = async (id) => {
  await deleteDoc(doc(db, "sleepData", id));
  alert("Record deleted.");
};

document.querySelectorAll(".sound-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    const sound = btn.dataset.sound;
    player.src = soundMap[sound];
    player.volume = 0.6;
    player.play();
  });
});

stopSoundBtn.addEventListener("click", () => {
  player.pause();
  player.currentTime = 0;
});

// 初始執行
renderCards("default");
startCycle();
