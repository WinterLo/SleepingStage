// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDQRfAZFgZsnyg1DiyZX-se0infwRDWK00",
  authDomain: "doodle-3-14e93.firebaseapp.com",
  projectId: "doodle-3-14e93",
  storageBucket: "doodle-3-14e93.appspot.com",
  messagingSenderId: "975561847283",
  appId: "1:975561847283:web:e41c2b2306c86ce5c4e286"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

Vue.createApp({
  data() {
    return {
      email: "",
      password: "",
      passwordVerified: "",
      agreeAllTerms: false,
      passwordNotConsistent: false,
      termsUnchecked: false,
      isLogin: false,
      isLoginMode: true,
      currentUser: null,

      selectedStage: 'default',
      sleepTime: '',
      turnOvers: '',
      heartbeat: '',
      formStage: null,
      editingId: null,
      sleepRecords: [],
      currentIndex: 0,
      interval: null,
      soundMap: {
        rain: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        ocean: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        forest: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        fire: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
      },

      statuses: [
        { stage: "Awake", value: "awake", bgClass: "awake-bg", emoji: "😀", card: { title: "Awake Stage", image: "https://i.imgur.com/pMRxAQR.png", text: "You are alert and aware." } },
        { stage: "Light Sleep", value: "light-sleep", bgClass: "light-sleep-bg", emoji: "😪", card: { title: "Light Sleep", image: "https://i.imgur.com/9XzHzsA.png", text: "Body begins to relax." } },
        { stage: "Deep Sleep", value: "deep-sleep", bgClass: "deep-sleep-bg", emoji: "😴", card: { title: "Deep Sleep", image: "https://i.imgur.com/Gpv9DP2.png", text: "Most restorative stage." } },
        { stage: "Dreaming", value: "dream", bgClass: "dream-bg", emoji: "🤩", card: { title: "REM Sleep", image: "https://i.imgur.com/jKezCuP.png", text: "Dreams occur during REM." } }
      ]
    };
  },
  computed: {
    positionClasses() {
      return ['position-1', 'position-2', 'position-3', 'position-4'];
    }
  },
  methods: {
    switchMode() {
      this.isLoginMode = !this.isLoginMode;
      this.passwordNotConsistent = false;
      this.termsUnchecked = false;
    },
    register() {
      if (this.password !== this.passwordVerified) {
        this.passwordNotConsistent = true;
        return;
      }
      if (!this.agreeAllTerms) {
        this.termsUnchecked = true;
        return;
      }
      auth.createUserWithEmailAndPassword(this.email, this.password)
        .then(res => {
          this.currentUser = res.user;
          this.isLogin = true;
        })
        .catch(err => alert(err.message));
    },
    signIn() {
  auth.signInWithEmailAndPassword(this.email, this.password)
    .then(res => {
      this.currentUser = res.user;
      this.isLogin = true;
      location.reload(); // 強制刷新頁面
    })
    .catch(err => alert(err.message));
}
    loginWithGoogle() {
      auth.signInWithPopup(provider)
        .then(result => {
          this.currentUser = result.user;
          this.isLogin = true;
        })
        .catch(err => alert(err.message));
    },
    logOut() {
      auth.signOut().then(() => {
        this.isLogin = false;
        this.currentUser = null;
      });
    },
    selectFormStage(stage) {
      this.formStage = stage;
    },
    getStageName(value) {
      const found = this.statuses.find(s => s.value === value);
      return found ? found.stage : 'General';
    },
    playSound(type) {
      const audio = this.$refs.player;
      const url = this.soundMap[type];
      if (!url || !audio) return;
      audio.src = url;
      audio.volume = 0.6;
      audio.play();
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 30000);
    },
    stopSound() {
      const audio = this.$refs.player;
      if (audio && !audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    },
    async saveData() {
      const timestamp = new Date().toISOString();
      const docId = this.editingId || timestamp;
      await db.collection("sleepData").doc(docId).set({
        sleepTime: this.sleepTime,
        turnOvers: this.turnOvers,
        heartbeat: this.heartbeat,
        submittedAt: timestamp,
        category: this.formStage || "general"
      });
      this.sleepTime = '';
      this.turnOvers = '';
      this.heartbeat = '';
      this.formStage = null;
      this.editingId = null;
    },
    editRecord(record) {
      this.sleepTime = record.sleepTime;
      this.turnOvers = record.turnOvers;
      this.heartbeat = record.heartbeat;
      this.formStage = record.category;
      this.editingId = record.id;
    },
    async deleteRecord(id) {
      await db.collection("sleepData").doc(id).delete();
    }
  },
  mounted() {
    auth.onAuthStateChanged(user => {
      if (user) {
        this.currentUser = user;
        this.isLogin = true;
      }
    });
    db.collection("sleepData").onSnapshot(snapshot => {
      this.sleepRecords = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
    this.interval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.statuses.length;
    }, 2000);
  }
}).component('sleep-status', {
  props: ['emoji', 'stage', 'bgClass', 'isVisible'],
  template: `
    <div class="sleep-status" :class="[bgClass, isVisible ? 'visible' : '']">
      {{ emoji }} {{ stage }}
    </div>
  `
}).mount("#app");
