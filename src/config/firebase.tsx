import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyDAwdqU-4k5Azb1fNF9RFLAlT-RaMSDUPo',
  authDomain: 'appelent-bc868.firebaseapp.com',
  projectId: 'appelent-bc868',
  storageBucket: 'appelent-bc868.appspot.com',
  messagingSenderId: '726562505952',
  appId: '1:726562505952:web:d05c0d37da55129551fc85',
  measurementId: 'G-SCBJ5EM94B',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth();
