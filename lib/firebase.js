import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';

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

// Collection reference
const tasksCollection = collection(db, 'tasks');

// Task operations
export const taskService = {
  // Get all tasks for a device/user
  async getTasks(deviceId) {
    const q = query(tasksCollection, where('deviceId', '==', deviceId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Subscribe to real-time updates
  subscribeToTasks(deviceId, callback) {
    const q = query(tasksCollection, where('deviceId', '==', deviceId));
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(tasks);
    });
  },

  // Add a new task
  async addTask(deviceId, taskData) {
    const task = {
      ...taskData,
      deviceId,
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
};

export { db };
