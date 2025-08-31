import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const TVET_PROGRAMS_COLLECTION = "tvet_programs";
const USERS_COLLECTION = "users";

const mockPrograms = [
  {
    id: "mock-1",
    title: "Electrical Installation",
    description: "Hands-on wiring, safety, and maintenance for homes and industry.",
    category: "Engineering",
    imageUrl: ""
  },
  {
    id: "mock-2",
    title: "Fashion Design",
    description: "Pattern cutting, sewing, and fashion entrepreneurship.",
    category: "Creative Arts",
    imageUrl: ""
  },
  {
    id: "mock-3",
    title: "Welding & Fabrication",
    description: "Metalwork, tools handling, and fabrication projects.",
    category: "Engineering",
    imageUrl: ""
  }
];

const mockScholarships = [
  {
    id: "tvet-sch-1",
    title: "Nigerian TVET Skills Fund",
    description: "Support for learners in accredited TVET programs.",
    amount: 150000,
    deadline: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
    level: "TVET",
    state: "All States",
    website: "",
    category: "Government",
    slots: 100
  },
  {
    id: "tvet-sch-2",
    title: "Corporate TVET Empowerment",
    description: "Tools and tuition support for vocational trainees.",
    amount: 200000,
    deadline: new Date(Date.now() + 45*24*60*60*1000).toISOString(),
    level: "TVET",
    state: "All States",
    website: "",
    category: "Corporate",
    slots: 50
  }
];

export async function getTvetPrograms() {
  try {
    const ref = collection(db, TVET_PROGRAMS_COLLECTION);
    const q = query(ref, orderBy("title", "asc"));
    const snap = await getDocs(q);
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    return items.length > 0 ? items : mockPrograms;
  } catch (e) {
    console.error("Error loading TVET programs:", e);
    return mockPrograms;
  }
}

export async function addTvetProgram(program) {
  const ref = collection(db, TVET_PROGRAMS_COLLECTION);
  const payload = {
    title: program.title || "Untitled",
    description: program.description || "",
    category: program.category || "General",
    imageUrl: program.imageUrl || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await setDoc(doc(ref), payload);
  return { success: true, id: docRef?.id };
}

export async function updateTvetProgram(id, updates) {
  const ref = doc(db, TVET_PROGRAMS_COLLECTION, id);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
  return { success: true };
}

export async function deleteTvetProgram(id) {
  try {
    const ref = doc(db, TVET_PROGRAMS_COLLECTION, id);
    // Firestore v9: deleteDoc is not imported initially; use update workaround or add import if needed
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(ref);
    return { success: true };
  } catch (e) {
    console.error("Error deleting program:", e);
    return { success: false, error: e.message };
  }
}

export async function getTvetScholarships() {
  try {
    // Try to find scholarships tagged for TVET by level or category
    const ref = collection(db, "scholarships");
    const q = query(ref, where("level", "==", "TVET"));
    const snap = await getDocs(q);
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    return items.length > 0 ? items : mockScholarships;
  } catch (e) {
    console.error("Error loading TVET scholarships:", e);
    return mockScholarships;
  }
}

export async function saveProgramForUser(userId, program) {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create new user document with saved program
      await setDoc(userRef, {
        savedPrograms: [
          {
            id: program.id,
            title: program.title,
            category: program.category || "",
            savedAt: serverTimestamp()
          }
        ],
        dashboard: {
          savedOpportunities: 1
        }
      });
      return { success: true };
    }
    
    const userData = userDoc.data();
    const savedPrograms = userData.savedPrograms || [];
    
    // Check if already saved
    const alreadySaved = savedPrograms.find(p => p.id === program.id);
    if (alreadySaved) {
      return { success: false, error: "Program already saved" };
    }
    
    // Add to saved programs
    const updatedSavedPrograms = [...savedPrograms, {
      id: program.id,
      title: program.title,
      category: program.category || "",
      savedAt: serverTimestamp()
    }];
    
    // Update user document with new saved programs and increment saved opportunities
    await updateDoc(userRef, {
      savedPrograms: updatedSavedPrograms,
      "dashboard.savedOpportunities": (userData.dashboard?.savedOpportunities || 0) + 1
    });
    
    return { success: true };
  } catch (e) {
    console.error("Error saving program:", e);
    return { success: false, error: e.message };
  }
}

export async function removeSavedProgramForUser(userId, program) {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: "User not found" };
    }
    
    const userData = userDoc.data();
    const savedPrograms = userData.savedPrograms || [];
    
    // Remove the program
    const updatedSavedPrograms = savedPrograms.filter(p => p.id !== program.id);
    
    // Update user document
    await updateDoc(userRef, {
      savedPrograms: updatedSavedPrograms,
      "dashboard.savedOpportunities": Math.max((userData.dashboard?.savedOpportunities || 0) - 1, 0)
    });
    
    return { success: true };
  } catch (e) {
    console.error("Error removing saved program:", e);
    return { success: false, error: e.message };
  }
}

// Get user's saved programs
export async function getUserSavedPrograms(userId) {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.savedPrograms || [];
    }
    
    return [];
  } catch (e) {
    console.error("Error getting user saved programs:", e);
    return [];
  }
}


