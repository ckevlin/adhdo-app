import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCh0aN6A6-RCGNQXMbUkVOaGWxkGoXaB-s",
  authDomain: "adhdo-955f2.firebaseapp.com",
  projectId: "adhdo-955f2",
  storageBucket: "adhdo-955f2.firebasestorage.app",
  messagingSenderId: "633004346244",
  appId: "1:633004346244:web:702a7fda5e5892ee50ebd1"
};

// Initialize Firebase (prevent multiple initializations)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

// Collection reference
const tasksCollection = collection(db, 'tasks');

// Auth operations
export const authService = {
  // Send magic link to email
  async sendMagicLink(email) {
    const actionCodeSettings = {
      url: typeof window !== 'undefined' ? window.location.origin : 'https://adhdo-app.vercel.app',
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Save email to localStorage for when they click the link
    if (typeof window !== 'undefined') {
      localStorage.setItem('adhdo-signin-email', email);
    }
  },

  // Complete sign in when user clicks magic link
  async completeMagicLinkSignIn() {
    if (typeof window === 'undefined') return null;
    
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = localStorage.getItem('adhdo-signin-email');
      if (!email) {
        // User opened link on different device, ask for email
        email = window.prompt('Please enter your email to confirm sign in:');
      }
      if (email) {
        const result = await signInWithEmailLink(auth, email, window.location.href);
        localStorage.removeItem('adhdo-signin-email');
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return result.user;
      }
    }
    return null;
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },

  // Subscribe to auth state changes
  onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // Sign out
  async signOut() {
    await signOut(auth);
  },
};

// Task operations
export const taskService = {
  // Get all tasks for a user
  async getTasks(userId) {
    const q = query(tasksCollection, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Subscribe to real-time updates
  subscribeToTasks(userId, callback) {
    const q = query(tasksCollection, where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(tasks);
    });
  },

  // Add a new task
  async addTask(userId, taskData) {
    const task = {
      ...taskData,
      userId,
      completed: false,
      urgent: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(tasksCollection, task);
    return { id: docRef.id, ...task };
  },

  // Update a task
  async updateTask(taskId, updates) {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete a task
  async deleteTask(taskId) {
    const taskRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskRef);
  },

  // Complete a task
  async completeTask(taskId) {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      completed: true,
      completedAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
  },

  // Uncomplete a task
  async uncompleteTask(taskId) {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      completed: false,
      completedAt: null,
      updatedAt: serverTimestamp(),
    });
  },

  // Migrate tasks from deviceId to userId
  async migrateTasks(deviceId, userId) {
    const q = query(tasksCollection, where('deviceId', '==', deviceId));
    const snapshot = await getDocs(q);
    const batch = [];
    snapshot.docs.forEach(docSnap => {
      const taskRef = doc(db, 'tasks', docSnap.id);
      batch.push(updateDoc(taskRef, { userId, deviceId: null }));
    });
    await Promise.all(batch);
    return snapshot.docs.length;
  },
};

export { db, auth };
