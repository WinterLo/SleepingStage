// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDQRfAZFgZsnyg1DiyZX-se0infwRDWK00",
  authDomain: "doodle-3-14e93.firebaseapp.com",
  projectId: "doodle-3-14e93",
  storageBucket: "doodle-3-14e93.appspot.com",
  messagingSenderId: "975561847283",
  appId: "1:975561847283:web:e41c2b2306c86ce5c4e286",
  measurementId: "G-MYG06JN42L"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();
const sleepRef = db.collection("sleepData");

const { createApp, ref, reactive, computed, onMounted } = Vue;

createApp({
  setup() {
    const email = ref("");
    const password = ref("");
    const passwordVerified = ref("");
    const agreeAllTerms = ref(false);
    const isLogin = ref(false);
    const isLoginMode = ref(true);
    const currentUser = ref(null);
    const passwordNotConsistent = ref(false);
    const termsUnchecked = ref(false);
    const signupSuccess = ref(false);

    const selectedStage = ref("default");
    const sleepTime = ref("");
    const turnOvers = ref("");
    const heartbeat = ref("");
    const formStage = ref(null);
    const editingId = ref(null);
    const sleepRecords = ref([]);
    const currentIndex = ref(0);
    const interval = ref(null);
    const player = ref(null);

    const statuses = [
      { stage: "Awake", value: "awake", bgClass: "awake-bg", card: { title: "Awake Stage", image: "https://i.imgur.com/pMRxAQR.png", text: "You are alert and aware." } },
      { stage: "Light Sleep", value: "light-sleep", bgClass: "light-sleep-bg", card: { title: "Light Sleep", image: "https://i.imgur.com/9XzHzsA.png", text: "Body begins to relax." } },
      { stage: "Deep Sleep", value: "deep-sleep", bgClass: "deep-sleep-bg", card: { title: "Deep Sleep", image: "https://i.imgur.com/Gpv9DP2.png", text: "Most restorative stage." } },
      { stage: "Dreaming", value: "dream", bgClass: "dream-bg", card: { title: "REM Sleep", image: "https://i.imgur.com/jKezCuP.png", text: "Dreams occur during REM." } },
    ];

    const soundMap = {
      rain: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      ocean: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      forest: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      fire: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    };

    const passwordMismatch = computed(() =>
      !isLoginMode.value && password.value !== passwordVerified.value
    );

    const isCycling = computed(() => selectedStage.value === "default");

    function startCycle() {
      interval.value = setInterval(() => {
        currentIndex.value = (currentIndex.value + 1) % statuses.length;
      }, 2000);
    }

    function stopCycle() {
      clearInterval(interval.value);
    }

    function toggleMode() {
      isLoginMode.value = !isLoginMode.value;
      passwordNotConsistent.value = false;
      termsUnchecked.value = false;
    }

    function submitForm() {
      if (!agreeAllTerms.value) {
        termsUnchecked.value = true;
        return;
      }
      if (!isLoginMode.value && password.value !== passwordVerified.value) {
        passwordNotConsistent.value = true;
        return;
      }

      if (isLoginMode.value) {
        auth.signInWithEmailAndPassword(email.value, password.value)
          .then(res => {
            isLogin.value = true;
            currentUser.value = res.user;
          })
          .catch(err => alert(err.message));
      } else {
        auth.createUserWithEmailAndPassword(email.value, password.value)
          .then(res => {
            currentUser.value = res.user;
            isLogin.value = true;
          })
          .catch(err => alert(err.message));
      }
    }

    function loginWithGoogle() {
      auth.signInWithPopup(provider)
        .then(result => {
          currentUser.value = result.user;
          isLogin.value = true;
        })
        .catch(err => alert(err.message));
    }

    function logOut() {
      auth.signOut().then(() => {
        isLogin.value = false;
        currentUser.value = null;
      });
    }

    function playSound(type) {
      const url = soundMap[type];
      if (!url) return;
      const audio = player.value;
      audio.src = url;
      audio.volume = 0.6;
      audio.play();
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 30000);
    }

    function stopSound() {
      const audio = player.value;
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    }

    async function saveData() {
      const timestamp = new Date().toISOString();
      const docId = editingId.value || timestamp;
      await db.collection("sleepData").doc(docId).set({
        sleepTime: sleepTime.value,
        turnOvers: turnOvers.value,
        heartbeat: heartbeat.value,
        submittedAt: timestamp,
        category: formStage.value || "general",
      });
      sleepTime.value = "";
      turnOvers.value = "";
      heartbeat.value = "";
      formStage.value = null;
      editingId.value = null;
    }

    function editRecord(record) {
      sleepTime.value = record.sleepTime;
      turnOvers.value = record.turnOvers;
      heartbeat.value = record.heartbeat;
      formStage.value = record.category;
      editingId.value = record.id;
    }

    async function deleteRecord(id) {
      await db.collection("sleepData").doc(id).delete();
    }

    function getStageName(value) {
      const match = statuses.find(s => s.value === value);
      return match ? match.stage : 'General';
    }

    function selectFormStage(stage) {
      formStage.value = stage;
    }

    onMounted(() => {
      if (isCycling.value) startCycle();
      auth.onAuthStateChanged(user => {
        if (user) {
          isLogin.value = true;
          currentUser.value = user;
        }
      });
      db.collection("sleepData").onSnapshot(snapshot => {
        sleepRecords.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
      });
    });

    return {
      email, password, passwordVerified, agreeAllTerms, isLogin, isLoginMode, currentUser,
      passwordNotConsistent, termsUnchecked, signupSuccess, selectedStage, sleepTime,
      turnOvers, heartbeat, formStage, editingId, sleepRecords, statuses, currentIndex,
      player, isCycling, startCycle, stopCycle, toggleMode, submitForm, loginWithGoogle,
      logOut, playSound, stopSound, saveData, editRecord, deleteRecord,
      getStageName, selectFormStage, passwordMismatch
    };
  }
}).mount("#app");
