
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, push, remove, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCpn3y683cRpgEt4THj3Cm3XKRCV94XcP0",
  authDomain: "derasa-59d0b.firebaseapp.com",
  databaseURL: "https://derasa-59d0b-default-rtdb.firebaseio.com",
  projectId: "derasa-59d0b",
  storageBucket: "derasa-59d0b.firebasestorage.app",
  messagingSenderId: "973960870124",
  appId: "1:973960870124:web:bbe95d691a88aa96cf0dc9",
  measurementId: "G-NF59ZQDEWF"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, onValue, push, remove, update };
