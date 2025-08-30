import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../firebaseConfig";

const USER_PROFILES = "user_profiles";
const NOTIFICATIONS = "notifications";

export async function getUserProfile(userId) {
  const snap = await getDoc(doc(db, USER_PROFILES, userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function upsertUserProfile(userId, data) {
  const ref = doc(db, USER_PROFILES, userId);
  const payload = {
    ...data,
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, payload, { merge: true });
  return { success: true };
}

export async function uploadAvatar(userId, file) {
  const avatarRef = ref(storage, `avatars/${userId}`);
  await uploadBytes(avatarRef, file);
  const url = await getDownloadURL(avatarRef);
  await upsertUserProfile(userId, { photoURL: url });
  return url;
}

export async function getNotifications(userId) {
  try {
    const ref = collection(db, NOTIFICATIONS);
    const q = query(ref, where("userId", "==", userId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    
    // Fallback to mock notifications if no data
    if (items.length === 0) {
      console.warn("No notifications found in Firestore, returning mock data.");
      return [
        {
          id: "mock-1",
          userId: userId,
          title: "New Scholarship Available",
          message: "Federal Government Scholarship for Nigerian Students is now open for applications.",
          type: "scholarship",
          read: false,
          createdAt: { toDate: () => new Date(Date.now() - 3600000) } // 1 hour ago
        },
        {
          id: "mock-2",
          userId: userId,
          title: "Forum Reply",
          message: "Jane replied to your post about TVET programs.",
          type: "forum",
          postId: "mock-post-1",
          read: true,
          createdAt: { toDate: () => new Date(Date.now() - 7200000) } // 2 hours ago
        },
        {
          id: "mock-3",
          userId: userId,
          title: "Quiz Reminder",
          message: "You have 3 quizzes available to complete. Boost your profile!",
          type: "quiz",
          read: false,
          createdAt: { toDate: () => new Date(Date.now() - 86400000) } // 1 day ago
        }
      ];
    }
    return items;
  } catch (e) {
    console.error("Error loading notifications:", e);
    return [];
  }
}

export async function markNotificationRead(notificationId) {
  try {
    await updateDoc(doc(db, NOTIFICATIONS, notificationId), { read: true });
  } catch (e) {
    console.error("Error marking notification read:", e);
  }
}


