import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDDJ5Qc64SZnwGCRBShtbyHLYaGBweAwdk",
  authDomain: "cloud-auth-2b3af.firebaseapp.com",
  projectId: "cloud-auth-2b3af",
  storageBucket: "cloud-auth-2b3af.firebasestorage.app",
  messagingSenderId: "482327951103",
  appId: "1:482327951103:web:ef6b58ae5dcbfdd8083eca"
};


export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)

