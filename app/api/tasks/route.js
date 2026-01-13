import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCh0aN6A6-RCGNQXMbUkVOaGWxkGoXaB-s",
  authDomain: "adhdo-955f2.firebaseapp.com",
  projectId: "adhdo-955f2",
  storageBucket: "adhdo-955f2.firebasestorage.app",
  messagingSenderId: "633004346244",
  appId: "1:633004346244:web:702a7fda5e5892ee50ebd1"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function POST(request) {
  try {
    const body = await request.json();
    const { deviceId, text, doDate, category, location, subtasks } = body;

    if (!deviceId || !text) {
      return Response.json(
        { error: 'deviceId and text are required' },
        { status: 400 }
      );
    }

    const task = {
      deviceId,
      text,
      completed: false,
      urgent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      doDate: doDate || null,
      category: category || 'general',
      location: location || 'either',
      subtasks: subtasks || [],
    };

    const docRef = await addDoc(collection(db, 'tasks'), task);

    return Response.json({
      success: true,
      task: { id: docRef.id, ...task }
    });
  } catch (error) {
    console.error('Error adding task:', error);
    return Response.json(
      { error: 'Failed to add task' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return Response.json(
        { error: 'deviceId is required' },
        { status: 400 }
      );
    }

    const q = query(collection(db, 'tasks'), where('deviceId', '==', deviceId));
    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return Response.json({ tasks });
  } catch (error) {
    console.error('Error getting tasks:', error);
    return Response.json(
      { error: 'Failed to get tasks' },
      { status: 500 }
    );
  }
}
