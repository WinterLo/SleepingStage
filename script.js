firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDQRfAZFgZsnyg1DiyZX-se0infwRDWK00",
  authDomain: "doodle-3-14e93.firebaseapp.com",
  projectId: "doodle-3-14e93",
  storageBucket: "doodle-3-14e93.firebasestorage.app",
  messagingSenderId: "975561847283",
  appId: "1:975561847283:web:e41c2b2306c86ce5c4e286",
  measurementId: "G-MYG06JN42L"
};

import {
  getFirestore,
  doc,
  setDoc,
  collection,
  onSnapshot,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const auth = getAuth(app);

let sleepRef = collection(db, 'sleepData');

const App = Vue.createApp({
  data() {
    return {
      selectedStage: 'default',
      sleepTime: '',
      turnOvers: '',
      heartbeat: '',
      sleepRecords: [],
      formStage: null,
      editingId: null,

      statuses: [
        {
          stage: 'Awake',
          value: 'awake',
          bgClass: 'awake-bg',
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
          card: {
            title: 'REM Sleep',
            image: 'https://i.imgur.com/jKezCuP.png',
            text: 'Dreams occur during REM sleep. It supports memory and emotional processing.'
          }
        }
      ],

      currentIndex: 0,
      interval: null,
      currentAudio: null,

      soundMap: {
  rain: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  ocean: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  forest: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  fire: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
      },
      email: "",
      password: "",
      passwordVerified: "",
      isLogin: false,
      currentUser: null,
      isLoginMode: false,
      isSignUpMode: true,
      agreeAllTerms: false,
      passwordNotConsistent: false,
      termsUnchecked: false,
      signupSucess: false
  };
  },

  computed: {
    sleepLevel() {
      return this.selectedStage === 'default'
        ? this.currentIndex
        : this.statuses.findIndex(status => status.value === this.selectedStage);
    },
    isCycling() {
      return this.selectedStage === 'default';
    },
    positionClasses() {
      return ['position-1', 'position-2', 'position-3', 'position-4'];
    }
  },

  watch: {
    isCycling(newVal) {
      newVal ? this.startCycle() : this.stopCycle();
    }
    },
  mounted() {
    if (this.isCycling) this.startCycle();

    // Realtime listener from Firestore
    onSnapshot(sleepRef, (snapshot) => {
      this.sleepRecords = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
   onAuthStateChanged(auth, (user) => {
  if (user) {
    this.currentUser = user;
    this.isLogin = true;
  } else {
    this.isLogin = false;
    this.currentUser = null;
  }
});
  },

  methods: {
    register() {
  if (this.password !== this.passwordVerified) {
    this.passwordNotConsistent = true;
    return;
  }
  if (!this.agreeAllTerms) {
    this.termsUnchecked = true;
    return;
  }

  createUserWithEmailAndPassword(auth, this.email, this.password)
    .then((data) => {
      this.currentUser = auth.currentUser;
      this.signupSuccess = true;
      this.switchMode(); // switch to login
    })
    .catch((error) => {
      alert("Registration failed: " + error.message);
    });
},

signIn() {
  signInWithEmailAndPassword(auth, this.email, this.password)
    .then((userCredential) => {
      this.currentUser = userCredential.user;
      this.isLogin = true;
    })
    .catch((error) => {
      alert("Login failed: " + error.message);
    });
},

loginWithGoogle() {
  signInWithPopup(auth, provider)
    .then((result) => {
      this.currentUser = result.user;
      this.isLogin = true;
    })
    .catch((error) => {
      alert("Google Login failed: " + error.message);
    });
},

logOut() {
  signOut(auth).then(() => {
    this.isLogin = false;
    this.email = "";
    this.password = "";
    this.passwordVerified = "";
  });
},

switchMode() {
  this.isLoginMode = !this.isLoginMode;
},

      selectFormStage(stageValue) {
    this.formStage = stageValue;
  },
  getStageName(value) {
    const match = this.statuses.find(s => s.value === value);
    return match ? match.stage : 'General';
  },
    startCycle() {
      this.interval = setInterval(() => {
        this.currentIndex = (this.currentIndex + 1) % this.statuses.length;
      }, 2000);
    },

    stopCycle() {
      clearInterval(this.interval);
      this.interval = null;
    },

    shouldShowStatus(value, index) {
      if (this.selectedStage === 'all') return true;
      if (this.selectedStage === 'default') return index === this.currentIndex;
      return this.selectedStage === value;
    },

    async saveData() {
  try {
    const timestamp = new Date().toISOString();
    const docId = this.editingId || timestamp;

    await setDoc(doc(db, "sleepData", docId), {
      sleepTime: this.sleepTime,
      turnOvers: this.turnOvers,
      heartbeat: this.heartbeat,
      submittedAt: timestamp,
      category: this.formStage || "general"
    });

    alert(this.editingId ? "Sleep data updated!" : "Sleep data saved!");

    this.sleepTime = '';
    this.turnOvers = '';
    this.heartbeat = '';
    this.formStage = null;
    this.editingId = null;

  } catch (error) {
    console.error("Error saving sleep data:", error);
    alert("Failed to save data. Please try again.");
  }
},

    playSound(type) {
      try {
        const url = this.soundMap[type];
        if (!url) return;

        const audioEl = this.$refs.player;
        audioEl.src = url;
        audioEl.volume = 0.6;
        audioEl.play();

        setTimeout(() => {
          audioEl.pause();
          audioEl.currentTime = 0;
        }, 30000);
      } catch (e) {
        console.error("Audio play error:", e);
      }
    },
      // Delete data
    async deleteRecord(id) {
      await deleteDoc(doc(db, "sleepData", id));
      alert("Sleep Record deleted successfully!");
    },
    
      // Edit data    
    editRecord(record) {
      this.sleepTime = record.sleepTime;
      this.turnOvers = record.turnOvers;
      this.heartbeat = record.heartbeat;
      this.formStage = record.category;
      this.editingId = record.id;

      // Roll to the edit page
  const form = document.querySelector('.form-card');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth' });
      }
    },
    // Stop Music
    stopSound() {
      const audioEl = this.$refs.player;
      if (audioEl && !audioEl.paused) {
        audioEl.pause();
        audioEl.currentTime = 0;
      }
    }   
  }
});

App.component('sleep-status', {
  props: ['emoji', 'stage', 'bgClass', 'positionClass', 'isVisible'],
  template: `
    <div class="sleep-status" :class="[bgClass, positionClass, isVisible ? 'visible' : '']">
      {{ emoji }} {{ stage }}
    </div>
  `
});

App.mount("#app");




