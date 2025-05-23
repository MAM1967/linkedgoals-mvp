import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { HttpsOptions } from 'firebase-functions/v2/https'; // Import HttpsOptions


export const saveSmartGoal = onRequest({ runtime: 'nodejs20' } as HttpsOptions, async (req: any, res: any) => {
  // Allow CORS
  res.set('Access-Control-Allow-Origin', 'https://linkedgoals-d7053.web.app'); // It's best practice to specify the origin
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // Respond to CORS preflight request
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const smartGoalData: any = req.body;

  if (!smartGoalData) {
    res.status(400).send('No data provided in the request body.');
    return;
  }

  // Initialize Firebase Admin SDK if not already initialized
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  const db = admin.firestore();

  try {
    const docRef = await db.collection('goals').add(smartGoalData);
    console.log('Document written with ID:', docRef.id);
    res.status(201).json({ message: 'Goal saved successfully!', id: docRef.id });
  } catch (error) {
    console.error('Error saving goal:', error);
    res.status(500).send('Error saving goal to Firestore.');
 }
});