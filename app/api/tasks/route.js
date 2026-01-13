import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (for server-side)
// Note: For production, use service account credentials
const adminConfig = {
  projectId: "adhdo-955f2",
};

if (getApps().length === 0) {
  initializeApp(adminConfig);
}

const db = getFirestore();

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

    const docRef = await db.collection('tasks').add(task);

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

    const snapshot = await db.collection('tasks')
      .where('deviceId', '==', deviceId)
      .get();

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
