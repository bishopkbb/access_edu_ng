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
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      await setDoc(userRef, {
        savedPrograms: [
          {
            id: program.id,
            title: program.title,
            category: program.category || "",
            savedAt: serverTimestamp()
          }
        ]
      }, { merge: true });
      return { success: true };
    }
    await updateDoc(userRef, {
      savedPrograms: arrayUnion({
        id: program.id,
        title: program.title,
        category: program.category || "",
        savedAt: serverTimestamp()
      })
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
    await updateDoc(userRef, {
      savedPrograms: arrayRemove({
        id: program.id,
        title: program.title,
        category: program.category || "",
      })
    });
    return { success: true };
  } catch (e) {
    console.error("Error removing saved program:", e);
    return { success: false, error: e.message };
  }
}


