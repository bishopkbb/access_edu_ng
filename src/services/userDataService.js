import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// Initialize user data when they first sign up
export const initializeUserData = async (userId, userEmail) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create new user document with default data
      await setDoc(userRef, {
        email: userEmail,
        createdAt: serverTimestamp(),
        profile: {
          firstName: "",
          lastName: "",
          phone: "",
          state: "",
          gender: "",
          educationLevel: "",
          institution: "",
          courseOfStudy: "",
          graduationYear: "",
          gpa: "",
          completed: false
        },
        dashboard: {
          totalScholarships: 0,
          savedOpportunities: 0,
          applicationsCompleted: 0,
          savedScholarships: [],
          completedApplications: []
        },
        preferences: {
          language: "ENG",
          notifications: true,
          emailUpdates: true
        },
        quizProgress: {
          totalQuizzes: 0,
          completedQuizzes: 0,
          averageScore: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          quizHistory: []
        }
      });
    }
    
    return userDoc.data();
  } catch (error) {
    console.error("Error initializing user data:", error);
    throw error;
  }
};

// Get user's personal dashboard data
export const getUserDashboardData = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Ensure quizProgress exists for existing users
      if (!userData.quizProgress) {
        console.log("Adding quizProgress to existing user");
        await updateDoc(userRef, {
          quizProgress: {
            totalQuizzes: 0,
            completedQuizzes: 0,
            averageScore: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            quizHistory: []
          }
        });
        userData.quizProgress = {
          totalQuizzes: 0,
          completedQuizzes: 0,
          averageScore: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          quizHistory: []
        };
      }
      
      return {
        totalScholarships: userData.dashboard?.totalScholarships || 0,
        savedOpportunities: userData.dashboard?.savedOpportunities || 0,
        completedApplications: userData.dashboard?.applicationsCompleted || 0,
        savedScholarships: userData.dashboard?.savedScholarships || [],
        completedApplications: userData.dashboard?.completedApplications || [],
        profileCompleted: userData.profile?.completed || false,
        quizProgress: userData.quizProgress
      };
    }
    
    return {
      totalScholarships: 0,
      savedOpportunities: 0,
      completedApplications: 0,
      savedScholarships: [],
      completedApplications: [],
      profileCompleted: false,
      quizProgress: {
        totalQuizzes: 0,
        completedQuizzes: 0,
        averageScore: 0,
        totalQuestions: 0,
        correctAnswers: 0
      }
    };
  } catch (error) {
    console.error("Error getting user dashboard data:", error);
    throw error;
  }
};

// Save a scholarship to user's saved list
export const saveScholarship = async (userId, scholarship) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const savedScholarships = userData.dashboard?.savedScholarships || [];
      
      // Check if already saved
      const alreadySaved = savedScholarships.find(s => s.id === scholarship.id);
      if (alreadySaved) {
        return { success: false, message: "Scholarship already saved" };
      }
      
      // Add to saved list
      const updatedSavedScholarships = [...savedScholarships, {
        ...scholarship,
        savedAt: serverTimestamp()
      }];
      
      await updateDoc(userRef, {
        "dashboard.savedScholarships": updatedSavedScholarships,
        "dashboard.savedOpportunities": updatedSavedScholarships.length
      });
      
      return { success: true, message: "Scholarship saved successfully" };
    }
  } catch (error) {
    console.error("Error saving scholarship:", error);
    throw error;
  }
};

// Remove a scholarship from user's saved list
export const unsaveScholarship = async (userId, scholarshipId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const savedScholarships = userData.dashboard?.savedScholarships || [];
      
      const updatedSavedScholarships = savedScholarships.filter(s => s.id !== scholarshipId);
      
      await updateDoc(userRef, {
        "dashboard.savedScholarships": updatedSavedScholarships,
        "dashboard.savedOpportunities": updatedSavedScholarships.length
      });
      
      return { success: true, message: "Scholarship removed from saved list" };
    }
  } catch (error) {
    console.error("Error removing scholarship:", error);
    throw error;
  }
};

// Mark a scholarship application as completed
export const completeApplication = async (userId, scholarship) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const completedApplications = userData.dashboard?.completedApplications || [];
      
      // Check if already completed
      const alreadyCompleted = completedApplications.find(a => a.id === scholarship.id);
      if (alreadyCompleted) {
        return { success: false, message: "Application already marked as completed" };
      }
      
      // Add to completed list
      const updatedCompletedApplications = [...completedApplications, {
        ...scholarship,
        completedAt: serverTimestamp()
      }];
      
      await updateDoc(userRef, {
        "dashboard.completedApplications": updatedCompletedApplications,
        "dashboard.applicationsCompleted": updatedCompletedApplications.length
      });
      
      return { success: true, message: "Application marked as completed" };
    }
  } catch (error) {
    console.error("Error completing application:", error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      profile: profileData,
      "profile.completed": true
    });
    
    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data().profile || {};
    }
    
    return {};
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

// Update user preferences
export const updateUserPreferences = async (userId, preferences) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      preferences: preferences
    });
    
    return { success: true, message: "Preferences updated successfully" };
  } catch (error) {
    console.error("Error updating user preferences:", error);
    throw error;
  }
};

// Get user preferences
export const getUserPreferences = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data().preferences || {
        language: "ENG",
        notifications: true,
        emailUpdates: true
      };
    }
    
    return {
      language: "ENG",
      notifications: true,
      emailUpdates: true
    };
  } catch (error) {
    console.error("Error getting user preferences:", error);
    throw error;
  }
};
