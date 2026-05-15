import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCjfFUSiF_6TcE_upRUy8CMBf47rUt_aZE',
  authDomain: 'kiroku-01.firebaseapp.com',
  projectId: 'kiroku-01',
  storageBucket: 'kiroku-01.firebasestorage.app',
  messagingSenderId: '460984211075',
  appId: '1:460984211075:web:88515e30bfc2e630c16db6',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
