import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot 
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// Normalize scholarship objects to a consistent schema the UI expects
function toISODate(input) {
  try {
    if (!input) return null;
    if (typeof input === 'string') {
      const d = new Date(input);
      return isNaN(d.getTime()) ? null : d.toISOString();
    }
    if (typeof input?.toDate === 'function') {
      return input.toDate().toISOString();
    }
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

export function normalizeScholarship(raw = {}) {
  const title = (raw.title || '').toString().trim() || 'Untitled Scholarship';
  const description = (raw.description || '').toString().trim() || 'No description available';
  const category = raw.category || 'Private';
  const level = raw.level || 'Undergraduate';
  const state = raw.state || 'All States';
  const amountNum = Number(raw.amount);
  const amount = Number.isFinite(amountNum) ? amountNum : 0;
  const slotsNum = Number(raw.slots);
  const slots = Number.isFinite(slotsNum) && slotsNum > 0 ? slotsNum : 100;
  const deadline = toISODate(raw.deadline);
  const website = raw.website || '';
  const institution = raw.institution || '';
  const source = raw.source || '';
  const isActive = typeof raw.isActive === 'boolean' ? raw.isActive : true;
  return {
    title,
    description,
    category,
    level,
    state,
    amount,
    slots,
    deadline,
    website,
    institution,
    source,
    isActive,
    // preserve other fields if present
    ...('id' in raw ? { id: raw.id } : {}),
  };
}

// Get all active scholarships (not expired)
export const getActiveScholarships = async () => {
  try {
    const currentDate = new Date();
    const scholarshipsRef = collection(db, "scholarships");
    const q = query(
      scholarshipsRef,
      where("deadline", ">", currentDate.toISOString()),
      orderBy("deadline", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const scholarships = [];
    
    querySnapshot.forEach((docSnap) => {
      scholarships.push(
        normalizeScholarship({ id: docSnap.id, ...docSnap.data() })
      );
    });
    
    if (scholarships.length === 0) {
      const items = await getMockScholarships();
      return items.map(normalizeScholarship);
    }
    
    return scholarships;
  } catch (error) {
    console.error("Error fetching active scholarships:", error);
    // Fallback to mock data if Firestore is not available
    const items = await getMockScholarships();
    return items.map(normalizeScholarship);
  }
};

// Get upcoming scholarship announcements
export const getUpcomingAnnouncements = async () => {
  try {
    const currentDate = new Date();
    const announcementsRef = collection(db, "announcements");
    const q = query(
      announcementsRef,
      where("expectedStart", ">", currentDate.toISOString()),
      orderBy("expectedStart", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const announcements = [];
    
    querySnapshot.forEach((doc) => {
      announcements.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return announcements;
  } catch (error) {
    console.error("Error fetching announcements:", error);
    // Fallback to mock data if Firestore is not available
    return await getMockAnnouncements();
  }
};

// Add new scholarship (admin function)
export const addScholarship = async (scholarshipData) => {
  try {
    const scholarshipsRef = collection(db, "scholarships");
    const normalized = normalizeScholarship(scholarshipData);
    const docRef = await addDoc(scholarshipsRef, {
      ...normalized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding scholarship:", error);
    throw error;
  }
};

// Update scholarship (admin function)
export const updateScholarship = async (scholarshipId, updateData) => {
  try {
    const scholarshipRef = doc(db, "scholarships", scholarshipId);
    const normalized = normalizeScholarship({ ...(updateData || {}) });
    await updateDoc(scholarshipRef, { ...normalized, updatedAt: serverTimestamp() });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating scholarship:", error);
    throw error;
  }
};

// Delete scholarship (admin function)
export const deleteScholarship = async (scholarshipId) => {
  try {
    const scholarshipRef = doc(db, "scholarships", scholarshipId);
    await deleteDoc(scholarshipRef);
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting scholarship:", error);
    throw error;
  }
};

// Add announcement (admin function)
export const addAnnouncement = async (announcementData) => {
  try {
    const announcementsRef = collection(db, "announcements");
    const docRef = await addDoc(announcementsRef, {
      ...announcementData,
      createdAt: serverTimestamp(),
      isActive: true
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding announcement:", error);
    throw error;
  }
};

// Real-time listener for scholarships (for live updates)
export const subscribeToScholarships = (callback) => {
  try {
    const currentDate = new Date();
    const scholarshipsRef = collection(db, "scholarships");
    const q = query(
      scholarshipsRef,
      where("deadline", ">", currentDate.toISOString()),
      orderBy("deadline", "asc")
    );
    
    return onSnapshot(q, async (querySnapshot) => {
      const scholarships = [];
      querySnapshot.forEach((docSnap) => {
        scholarships.push(
          normalizeScholarship({ id: docSnap.id, ...docSnap.data() })
        );
      });
      if (scholarships.length === 0) {
        const items = await getMockScholarships();
        callback(items.map(normalizeScholarship));
      } else {
        callback(scholarships);
      }
    });
  } catch (error) {
    console.error("Error setting up scholarships listener:", error);
    // Fallback to mock data
    getMockScholarships().then((items) => callback(items.map(normalizeScholarship)));
    return () => {}; // Return empty unsubscribe function
  }
};

// Real-time listener for announcements
export const subscribeToAnnouncements = (callback) => {
  try {
    const currentDate = new Date();
    const announcementsRef = collection(db, "announcements");
    const q = query(
      announcementsRef,
      where("expectedStart", ">", currentDate.toISOString()),
      orderBy("expectedStart", "asc")
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const announcements = [];
      querySnapshot.forEach((doc) => {
        announcements.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(announcements);
    });
  } catch (error) {
    console.error("Error setting up announcements listener:", error);
    // Fallback to mock data
    getMockAnnouncements().then((items) => callback(items));
    return () => {}; // Return empty unsubscribe function
  }
};

// Automated cleanup function (run periodically)
export const cleanupExpiredScholarships = async () => {
  try {
    const currentDate = new Date();
    const scholarshipsRef = collection(db, "scholarships");
    const q = query(
      scholarshipsRef,
      where("deadline", "<=", currentDate.toISOString()),
      where("isActive", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = [];
    
    querySnapshot.forEach((doc) => {
      batch.push(updateDoc(doc.ref, { isActive: false }));
    });
    
    if (batch.length > 0) {
      await Promise.all(batch);
      console.log(`Deactivated ${batch.length} expired scholarships`);
    }
  } catch (error) {
    console.error("Error cleaning up expired scholarships:", error);
  }
};

// Search scholarships with filters
export const searchScholarships = async (filters = {}) => {
  try {
    const currentDate = new Date();
    const scholarshipsRef = collection(db, "scholarships");
    
    let q = query(
      scholarshipsRef,
      where("deadline", ">", currentDate.toISOString()),
      where("isActive", "==", true)
    );
    
    // Add category filter
    if (filters.category && filters.category !== "all") {
      q = query(q, where("category", "==", filters.category));
    }
    
    // Add level filter
    if (filters.level && filters.level !== "all") {
      q = query(q, where("level", "==", filters.level));
    }
    
    // Add state filter
    if (filters.state && filters.state !== "all") {
      q = query(q, where("state", "==", filters.state));
    }
    
    // Add amount range filter
    if (filters.amount && filters.amount !== "all") {
      let minAmount = 0;
      let maxAmount = Infinity;
      
      switch (filters.amount) {
        case "low":
          maxAmount = 100000;
          break;
        case "medium":
          minAmount = 100000;
          maxAmount = 500000;
          break;
        case "high":
          minAmount = 500000;
          break;
      }
      
      q = query(q, where("amount", ">=", minAmount), where("amount", "<=", maxAmount));
    }
    
    const querySnapshot = await getDocs(q);
    const scholarships = [];
    
    querySnapshot.forEach((doc) => {
      scholarships.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return scholarships.map(normalizeScholarship);
  } catch (error) {
    console.error("Error searching scholarships:", error);
    // Fallback to mock data with client-side filtering
    const items = await getMockScholarships();
    return filterMockScholarships(items, filters).map(normalizeScholarship);
  }
};

// Helper function to filter mock scholarships
function filterMockScholarships(scholarships, filters) {
  return scholarships.filter(scholarship => {
    // Category filter
    if (filters.category && filters.category !== "all" && scholarship.category !== filters.category) {
      return false;
    }
    
    // Level filter
    if (filters.level && filters.level !== "all" && scholarship.level !== filters.level) {
      return false;
    }
    
    // State filter
    if (filters.state && filters.state !== "all" && scholarship.state !== filters.state) {
      return false;
    }
    
    // Amount filter
    if (filters.amount && filters.amount !== "all") {
      switch (filters.amount) {
        case "low":
          if (scholarship.amount >= 100000) return false;
          break;
        case "medium":
          if (scholarship.amount < 100000 || scholarship.amount >= 500000) return false;
          break;
        case "high":
          if (scholarship.amount < 500000) return false;
          break;
      }
    }
    
    return true;
  });
}

// Mock data functions (fallback when Firestore is not available)
async function getMockScholarships() {
  try {
    const { generateMockScholarships } = await import('./scholarshipDataGenerator');
    return generateMockScholarships(10).map(normalizeScholarship);
  } catch (error) {
    console.error('Error generating mock scholarships:', error);
    // Return basic mock data if import fails
    return [
      {
        id: 'mock-1',
        title: 'Nigerian Government Scholarship',
        description: 'Full scholarship for undergraduate studies in Nigerian universities',
        category: 'Government',
        level: 'Undergraduate',
        state: 'All States',
        amount: 500000,
        slots: 100,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        website: 'https://example.com',
        institution: 'Federal Government',
        source: 'Government',
        isActive: true
      },
      {
        id: 'mock-2',
        title: 'MTN Foundation Scholarship',
        description: 'Merit-based scholarship for science and engineering students',
        category: 'Private',
        level: 'Undergraduate',
        state: 'All States',
        amount: 200000,
        slots: 50,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
        website: 'https://example.com',
        institution: 'MTN Foundation',
        source: 'Private',
        isActive: true
      },
      {
        id: 'mock-3',
        title: 'Chevron Scholarship Program',
        description: 'Scholarship for students in petroleum engineering and related fields',
        category: 'Corporate',
        level: 'Undergraduate',
        state: 'All States',
        amount: 300000,
        slots: 75,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
        website: 'https://example.com',
        institution: 'Chevron',
        source: 'Corporate',
        isActive: true
      }
    ].map(normalizeScholarship);
  }
}

async function getMockAnnouncements() {
  try {
    const { generateMockAnnouncements } = await import('./scholarshipDataGenerator');
    return generateMockAnnouncements(5);
  } catch (error) {
    console.error('Error generating mock announcements:', error);
    return [];
  }
}
