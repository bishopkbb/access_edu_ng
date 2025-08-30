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
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// Sample quiz data with explanations
export const quizCategories = [
  {
    id: "scholarship-prep",
    name: "Scholarship Preparation",
    description: "Questions to help you prepare for scholarship applications",
    icon: "🎓",
    color: "bg-blue-500"
  },
  {
    id: "general-knowledge",
    name: "General Knowledge",
    description: "General educational questions",
    icon: "📚",
    color: "bg-green-500"
  },
  {
    id: "nigeria-history",
    name: "Nigerian History",
    description: "Questions about Nigerian history and culture",
    icon: "🇳🇬",
    color: "bg-yellow-500"
  },
  {
    id: "current-affairs",
    name: "Current Affairs",
    description: "Recent events and current topics",
    icon: "📰",
    color: "bg-purple-500"
  }
];

// Sample quiz questions with explanations
export const quizQuestions = {
  "scholarship-prep": [
    {
      id: 1,
      question: "What is the most important document you need for a scholarship application?",
      options: [
        "Birth certificate",
        "Academic transcript",
        "Passport photograph",
        "All of the above"
      ],
      correctAnswer: 3,
      explanation: "All documents are important for scholarship applications. Academic transcripts show your academic performance, birth certificate proves your identity and age, and passport photographs are required for identification. Having all documents ready increases your chances of success.",
      category: "scholarship-prep",
      difficulty: "easy"
    },
    {
      id: 2,
      question: "When should you start preparing for scholarship applications?",
      options: [
        "A few days before the deadline",
        "A week before the deadline",
        "At least 3-6 months before the deadline",
        "On the day of the deadline"
      ],
      correctAnswer: 2,
      explanation: "Starting early (3-6 months before) gives you time to gather all required documents, write compelling essays, get recommendation letters, and ensure your application is complete and polished. Rushing at the last minute often leads to mistakes.",
      category: "scholarship-prep",
      difficulty: "medium"
    },
    {
      id: 3,
      question: "What should you include in a scholarship essay?",
      options: [
        "Only your academic achievements",
        "Only your financial need",
        "Your goals, achievements, and why you deserve the scholarship",
        "Only your family background"
      ],
      correctAnswer: 2,
      explanation: "A comprehensive scholarship essay should include your academic and personal achievements, your future goals, why you need the scholarship, and how it will help you achieve your dreams. This gives the selection committee a complete picture of who you are.",
      category: "scholarship-prep",
      difficulty: "medium"
    },
    {
      id: 4,
      question: "What is a good strategy for finding scholarships?",
      options: [
        "Only apply to the most popular scholarships",
        "Focus only on your school's financial aid office",
        "Use multiple sources: online databases, school counselors, community organizations",
        "Wait for scholarships to find you"
      ],
      correctAnswer: 2,
      explanation: "The best strategy is to use multiple sources. Online databases like Fastweb, Scholarships.com, and government websites, along with your school's financial aid office, community organizations, and professional associations can all provide valuable scholarship opportunities.",
      category: "scholarship-prep",
      difficulty: "medium"
    },
    {
      id: 5,
      question: "What should you do if you don't receive a scholarship?",
      options: [
        "Give up and stop trying",
        "Apply for the same scholarships again next year",
        "Ask for feedback and improve your applications for future opportunities",
        "Complain to the scholarship committee"
      ],
      correctAnswer: 2,
      explanation: "Not receiving a scholarship is not the end. Ask for feedback when possible, improve your applications, and continue applying to other opportunities. Many students apply to multiple scholarships before receiving one.",
      category: "scholarship-prep",
      difficulty: "easy"
    },
    {
      id: 6,
      question: "What is the purpose of a personal statement in scholarship applications?",
      options: [
        "To list all your achievements",
        "To tell your unique story and connect with the selection committee",
        "To complain about financial difficulties",
        "To copy from other successful applications"
      ],
      correctAnswer: 1,
      explanation: "A personal statement should tell your unique story, including challenges you've overcome, your goals, and how the scholarship will help you achieve them. It should connect emotionally with the selection committee and show why you're deserving.",
      category: "scholarship-prep",
      difficulty: "medium"
    },
    {
      id: 7,
      question: "What should you do before submitting a scholarship application?",
      options: [
        "Submit immediately to meet the deadline",
        "Have someone else review it for errors and clarity",
        "Keep it to yourself to maintain confidentiality",
        "Submit multiple versions to increase chances"
      ],
      correctAnswer: 1,
      explanation: "Always have someone else review your application for grammar, clarity, and completeness. A fresh pair of eyes can catch errors you might miss and provide valuable feedback for improvement.",
      category: "scholarship-prep",
      difficulty: "easy"
    },
    {
      id: 8,
      question: "What is the best approach to recommendation letters?",
      options: [
        "Ask anyone who knows you",
        "Ask teachers or mentors who know you well and can speak to your strengths",
        "Write them yourself and ask someone to sign",
        "Use the same letter for all applications"
      ],
      correctAnswer: 1,
      explanation: "Choose recommenders who know you well and can speak specifically to your academic abilities, character, and potential. Teachers, mentors, or supervisors who have worked closely with you make the best recommenders.",
      category: "scholarship-prep",
      difficulty: "medium"
    },
    {
      id: 9,
      question: "What should you do if a scholarship requires an interview?",
      options: [
        "Wing it and hope for the best",
        "Practice common questions, research the organization, and prepare thoughtful questions",
        "Memorize a script and stick to it exactly",
        "Avoid eye contact to show humility"
      ],
      correctAnswer: 1,
      explanation: "Prepare thoroughly by practicing common interview questions, researching the scholarship organization, preparing thoughtful questions to ask, and dressing appropriately. Confidence and preparation are key to success.",
      category: "scholarship-prep",
      difficulty: "medium"
    },
    {
      id: 10,
      question: "What is the importance of meeting scholarship deadlines?",
      options: [
        "Deadlines are flexible and can be extended",
        "Late applications are always considered",
        "Meeting deadlines shows responsibility and respect for the process",
        "Deadlines don't matter if you have good grades"
      ],
      correctAnswer: 2,
      explanation: "Meeting deadlines demonstrates responsibility, respect for the selection committee's time, and your ability to manage time effectively. Late applications are typically not considered, regardless of qualifications.",
      category: "scholarship-prep",
      difficulty: "easy"
    },
    {
      id: 11,
      question: "What should you include in a scholarship resume?",
      options: [
        "Only academic achievements",
        "Only work experience",
        "Academic achievements, leadership roles, community service, and relevant skills",
        "Only personal information"
      ],
      correctAnswer: 2,
      explanation: "A comprehensive scholarship resume should include academic achievements, leadership roles, community service, relevant skills, and any awards or honors. This gives a complete picture of your qualifications and character.",
      category: "scholarship-prep",
      difficulty: "medium"
    },
    {
      id: 12,
      question: "What is the best way to follow up after submitting a scholarship application?",
      options: [
        "Call daily to check status",
        "Send a polite thank-you note and wait for their response",
        "Send multiple emails demanding updates",
        "Show up in person to check status"
      ],
      correctAnswer: 1,
      explanation: "Send a polite thank-you note acknowledging receipt of your application and expressing continued interest. This shows professionalism and keeps you on their radar without being pushy.",
      category: "scholarship-prep",
      difficulty: "easy"
    }
  ],
  "general-knowledge": [
    {
      id: 13,
      question: "What is the capital of Nigeria?",
      options: [
        "Lagos",
        "Abuja",
        "Kano",
        "Ibadan"
      ],
      correctAnswer: 1,
      explanation: "Abuja became Nigeria's capital in 1991, replacing Lagos. It was chosen as the capital because of its central location and to promote national unity. Lagos remains the country's largest city and economic hub.",
      category: "general-knowledge",
      difficulty: "easy"
    },
    {
      id: 14,
      question: "Which year did Nigeria gain independence from Britain?",
      options: [
        "1957",
        "1960",
        "1963",
        "1966"
      ],
      correctAnswer: 1,
      explanation: "Nigeria gained independence from British colonial rule on October 1, 1960. This marked the beginning of self-governance and the establishment of the Federal Republic of Nigeria.",
      category: "general-knowledge",
      difficulty: "easy"
    },
    {
      id: 15,
      question: "What is the largest continent in the world?",
      options: [
        "North America",
        "Europe",
        "Asia",
        "Africa"
      ],
      correctAnswer: 2,
      explanation: "Asia is the largest continent in the world, covering approximately 30% of Earth's land area. It includes countries like China, India, Japan, and many others.",
      category: "general-knowledge",
      difficulty: "easy"
    },
    {
      id: 16,
      question: "What is the chemical symbol for gold?",
      options: [
        "Ag",
        "Au",
        "Fe",
        "Cu"
      ],
      correctAnswer: 1,
      explanation: "Au is the chemical symbol for gold, derived from the Latin word 'aurum'. Gold is a precious metal that has been valued throughout human history.",
      category: "general-knowledge",
      difficulty: "medium"
    },
    {
      id: 17,
      question: "Who wrote 'Romeo and Juliet'?",
      options: [
        "Charles Dickens",
        "William Shakespeare",
        "Jane Austen",
        "Mark Twain"
      ],
      correctAnswer: 1,
      explanation: "William Shakespeare wrote 'Romeo and Juliet' in the late 16th century. It's one of his most famous plays and tells the story of two young lovers from feuding families.",
      category: "general-knowledge",
      difficulty: "medium"
    },
    {
      id: 18,
      question: "What is the largest ocean on Earth?",
      options: [
        "Atlantic Ocean",
        "Indian Ocean",
        "Pacific Ocean",
        "Arctic Ocean"
      ],
      correctAnswer: 2,
      explanation: "The Pacific Ocean is the largest and deepest ocean on Earth, covering about 30% of the Earth's surface. It's larger than all the land masses combined.",
      category: "general-knowledge",
      difficulty: "easy"
    },
    {
      id: 19,
      question: "What is the main component of the sun?",
      options: [
        "Liquid lava",
        "Molten iron",
        "Hydrogen gas",
        "Solid rock"
      ],
      correctAnswer: 2,
      explanation: "The sun is primarily composed of hydrogen gas (about 74%) and helium (about 24%). The sun's energy comes from nuclear fusion of hydrogen atoms.",
      category: "general-knowledge",
      difficulty: "medium"
    },
    {
      id: 20,
      question: "What is the smallest prime number?",
      options: [
        "0",
        "1",
        "2",
        "3"
      ],
      correctAnswer: 2,
      explanation: "2 is the smallest prime number. A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.",
      category: "general-knowledge",
      difficulty: "medium"
    },
    {
      id: 21,
      question: "What is the capital of France?",
      options: [
        "London",
        "Berlin",
        "Paris",
        "Madrid"
      ],
      correctAnswer: 2,
      explanation: "Paris is the capital and largest city of France. It's known for its art, fashion, gastronomy, and culture, and is often called the 'City of Light'.",
      category: "general-knowledge",
      difficulty: "easy"
    },
    {
      id: 22,
      question: "What year did World War II end?",
      options: [
        "1943",
        "1944",
        "1945",
        "1946"
      ],
      correctAnswer: 2,
      explanation: "World War II ended in 1945. The war in Europe ended on May 8, 1945 (V-E Day), and the war in the Pacific ended on September 2, 1945 (V-J Day).",
      category: "general-knowledge",
      difficulty: "medium"
    },
    {
      id: 23,
      question: "What is the largest planet in our solar system?",
      options: [
        "Earth",
        "Mars",
        "Jupiter",
        "Saturn"
      ],
      correctAnswer: 2,
      explanation: "Jupiter is the largest planet in our solar system. It's a gas giant with a mass more than twice that of Saturn and over 300 times that of Earth.",
      category: "general-knowledge",
      difficulty: "easy"
    },
    {
      id: 24,
      question: "What is the chemical formula for water?",
      options: [
        "H2O",
        "CO2",
        "O2",
        "N2"
      ],
      correctAnswer: 0,
      explanation: "H2O is the chemical formula for water, consisting of two hydrogen atoms bonded to one oxygen atom. Water is essential for all known forms of life.",
      category: "general-knowledge",
      difficulty: "easy"
    }
  ],
  "nigeria-history": [
    {
      id: 25,
      question: "Who was Nigeria's first President?",
      options: [
        "Nnamdi Azikiwe",
        "Tafawa Balewa",
        "Yakubu Gowon",
        "Murtala Mohammed"
      ],
      correctAnswer: 0,
      explanation: "Nnamdi Azikiwe, popularly known as 'Zik', was Nigeria's first President from 1963 to 1966. He was a prominent nationalist leader and played a crucial role in Nigeria's independence movement.",
      category: "nigeria-history",
      difficulty: "medium"
    },
    {
      id: 26,
      question: "What are the three major ethnic groups in Nigeria?",
      options: [
        "Hausa, Yoruba, Igbo",
        "Hausa, Fulani, Yoruba",
        "Yoruba, Igbo, Edo",
        "Hausa, Igbo, Kanuri"
      ],
      correctAnswer: 0,
      explanation: "The three major ethnic groups in Nigeria are Hausa, Yoruba, and Igbo. These groups have significant cultural, linguistic, and historical differences and are found in different regions of the country.",
      category: "nigeria-history",
      difficulty: "easy"
    },
    {
      id: 27,
      question: "What was the name of Nigeria's first Prime Minister?",
      options: [
        "Nnamdi Azikiwe",
        "Tafawa Balewa",
        "Yakubu Gowon",
        "Obafemi Awolowo"
      ],
      correctAnswer: 1,
      explanation: "Sir Abubakar Tafawa Balewa was Nigeria's first Prime Minister from 1960 to 1966. He was a prominent Northern politician and played a key role in Nigeria's early independence period.",
      category: "nigeria-history",
      difficulty: "medium"
    },
    {
      id: 28,
      question: "Which Nigerian city was the capital before Abuja?",
      options: [
        "Lagos",
        "Kano",
        "Ibadan",
        "Enugu"
      ],
      correctAnswer: 0,
      explanation: "Lagos was Nigeria's capital from independence in 1960 until 1991, when the capital was moved to Abuja. Lagos remains Nigeria's largest city and economic center.",
      category: "nigeria-history",
      difficulty: "easy"
    },
    {
      id: 29,
      question: "What year did Nigeria become a republic?",
      options: [
        "1960",
        "1961",
        "1962",
        "1963"
      ],
      correctAnswer: 3,
      explanation: "Nigeria became a republic on October 1, 1963, exactly three years after gaining independence. This marked the end of British monarchy rule and the establishment of a presidential system.",
      category: "nigeria-history",
      difficulty: "medium"
    },
    {
      id: 30,
      question: "Who was the first military ruler of Nigeria?",
      options: [
        "Yakubu Gowon",
        "Aguiyi Ironsi",
        "Murtala Mohammed",
        "Olusegun Obasanjo"
      ],
      correctAnswer: 1,
      explanation: "Major General Johnson Aguiyi Ironsi was Nigeria's first military ruler, taking power in January 1966 after the first military coup. His rule was short-lived, ending in July 1966.",
      category: "nigeria-history",
      difficulty: "hard"
    },
    {
      id: 31,
      question: "What is the significance of October 1st in Nigeria?",
      options: [
        "It's a religious holiday",
        "It's Nigeria's Independence Day",
        "It's the start of the school year",
        "It's a traditional festival day"
      ],
      correctAnswer: 1,
      explanation: "October 1st is Nigeria's Independence Day, commemorating the country's independence from British colonial rule in 1960. It's a national holiday celebrated across the country.",
      category: "nigeria-history",
      difficulty: "easy"
    },
    {
      id: 32,
      question: "Which Nigerian leader introduced the 'Green Revolution'?",
      options: [
        "Yakubu Gowon",
        "Murtala Mohammed",
        "Olusegun Obasanjo",
        "Shehu Shagari"
      ],
      correctAnswer: 2,
      explanation: "General Olusegun Obasanjo introduced the 'Green Revolution' during his military rule (1976-1979). This agricultural program aimed to increase food production and reduce dependence on food imports.",
      category: "nigeria-history",
      difficulty: "hard"
    },
    {
      id: 33,
      question: "What was the name of Nigeria's first university?",
      options: [
        "University of Lagos",
        "University of Ibadan",
        "University of Nigeria, Nsukka",
        "Ahmadu Bello University"
      ],
      correctAnswer: 1,
      explanation: "The University of Ibadan, established in 1948, was Nigeria's first university. It was originally a college of the University of London before becoming independent in 1962.",
      category: "nigeria-history",
      difficulty: "medium"
    },
    {
      id: 34,
      question: "Which Nigerian region was known for its palm oil production?",
      options: [
        "Northern Region",
        "Western Region",
        "Eastern Region",
        "Mid-Western Region"
      ],
      correctAnswer: 2,
      explanation: "The Eastern Region (now part of the South-East) was known for its palm oil production. Palm oil was a major export commodity and source of revenue for the region.",
      category: "nigeria-history",
      difficulty: "medium"
    },
    {
      id: 35,
      question: "What was the name of Nigeria's first national airline?",
      options: [
        "Nigeria Airways",
        "Air Nigeria",
        "Nigerian Airlines",
        "Nigeria Air"
      ],
      correctAnswer: 0,
      explanation: "Nigeria Airways was the country's first national airline, established in 1958. It operated both domestic and international flights until it was liquidated in 2003.",
      category: "nigeria-history",
      difficulty: "hard"
    },
    {
      id: 36,
      question: "Which Nigerian leader was known as 'The Iron Lady of Africa'?",
      options: [
        "Hajiya Gambo Sawaba",
        "Margaret Ekpo",
        "Funmilayo Ransome-Kuti",
        "All of the above"
      ],
      correctAnswer: 3,
      explanation: "These three women were prominent Nigerian activists and leaders who fought for women's rights and independence. They were all known for their strong leadership and were sometimes referred to as 'The Iron Ladies of Africa'.",
      category: "nigeria-history",
      difficulty: "hard"
    }
  ],
  "current-affairs": [
    {
      id: 37,
      question: "What is the current currency of Nigeria?",
      options: [
        "Naira",
        "Pound",
        "Dollar",
        "Euro"
      ],
      correctAnswer: 0,
      explanation: "The Nigerian Naira (₦) is the official currency of Nigeria. It was introduced in 1973, replacing the Nigerian Pound. The Central Bank of Nigeria manages the currency.",
      category: "current-affairs",
      difficulty: "easy"
    },
    {
      id: 38,
      question: "Who is the current President of Nigeria?",
      options: [
        "Muhammadu Buhari",
        "Bola Tinubu",
        "Goodluck Jonathan",
        "Olusegun Obasanjo"
      ],
      correctAnswer: 1,
      explanation: "Bola Ahmed Tinubu is the current President of Nigeria, having been inaugurated on May 29, 2023. He succeeded Muhammadu Buhari as the 16th President of Nigeria.",
      category: "current-affairs",
      difficulty: "easy"
    },
    {
      id: 39,
      question: "What is the name of Nigeria's current national anthem?",
      options: [
        "Arise, O Compatriots",
        "Nigeria, We Hail Thee",
        "The Star-Spangled Banner",
        "God Save the Queen"
      ],
      correctAnswer: 0,
      explanation: "'Arise, O Compatriots' is Nigeria's current national anthem, adopted in 1978. It replaced the previous anthem 'Nigeria, We Hail Thee' which was used from 1960 to 1978.",
      category: "current-affairs",
      difficulty: "medium"
    },
    {
      id: 40,
      question: "What is the largest city in Nigeria by population?",
      options: [
        "Abuja",
        "Lagos",
        "Kano",
        "Ibadan"
      ],
      correctAnswer: 1,
      explanation: "Lagos is Nigeria's largest city by population, with over 20 million people in its metropolitan area. It's the country's economic hub and commercial center.",
      category: "current-affairs",
      difficulty: "easy"
    },
    {
      id: 41,
      question: "What is the main export of Nigeria?",
      options: [
        "Cocoa",
        "Oil",
        "Timber",
        "Textiles"
      ],
      correctAnswer: 1,
      explanation: "Oil (petroleum) is Nigeria's main export and primary source of foreign exchange earnings. Nigeria is one of the largest oil producers in Africa.",
      category: "current-affairs",
      difficulty: "easy"
    },
    {
      id: 42,
      question: "What is the name of Nigeria's central bank?",
      options: [
        "Nigerian Bank",
        "Central Bank of Nigeria",
        "Federal Reserve of Nigeria",
        "Bank of Nigeria"
      ],
      correctAnswer: 1,
      explanation: "The Central Bank of Nigeria (CBN) is Nigeria's central bank, established in 1958. It regulates the banking sector and manages the country's monetary policy.",
      category: "current-affairs",
      difficulty: "medium"
    },
    {
      id: 43,
      question: "What is the current population of Nigeria?",
      options: [
        "About 150 million",
        "About 200 million",
        "About 250 million",
        "About 300 million"
      ],
      correctAnswer: 1,
      explanation: "Nigeria's current population is approximately 200 million people, making it the most populous country in Africa and the seventh most populous country in the world.",
      category: "current-affairs",
      difficulty: "medium"
    },
    {
      id: 44,
      question: "What is the name of Nigeria's highest court?",
      options: [
        "Supreme Court",
        "High Court",
        "Federal Court",
        "Constitutional Court"
      ],
      correctAnswer: 0,
      explanation: "The Supreme Court of Nigeria is the highest court in the country. It's the final court of appeal and has the power to interpret the constitution.",
      category: "current-affairs",
      difficulty: "medium"
    },
    {
      id: 45,
      question: "What is Nigeria's national flower?",
      options: [
        "Rose",
        "Hibiscus",
        "Sunflower",
        "Lily"
      ],
      correctAnswer: 1,
      explanation: "The Hibiscus (Hibiscus rosa-sinensis) is Nigeria's national flower. It's a tropical flower that grows well in Nigeria's climate and is used in traditional medicine.",
      category: "current-affairs",
      difficulty: "hard"
    },
    {
      id: 46,
      question: "What is the name of Nigeria's national football team?",
      options: [
        "Super Eagles",
        "Green Eagles",
        "Nigerian Lions",
        "Eagles of Nigeria"
      ],
      correctAnswer: 0,
      explanation: "The Super Eagles is the nickname of Nigeria's national football team. They have won the Africa Cup of Nations three times and have qualified for multiple FIFA World Cups.",
      category: "current-affairs",
      difficulty: "easy"
    },
    {
      id: 47,
      question: "What is the main religion in Northern Nigeria?",
      options: [
        "Christianity",
        "Islam",
        "Traditional African Religion",
        "Hinduism"
      ],
      correctAnswer: 1,
      explanation: "Islam is the predominant religion in Northern Nigeria, with the majority of the population being Muslim. This has influenced the culture, laws, and social practices in the region.",
      category: "current-affairs",
      difficulty: "medium"
    },
    {
      id: 48,
      question: "What is the name of Nigeria's largest river?",
      options: [
        "Niger River",
        "Benue River",
        "Cross River",
        "Kaduna River"
      ],
      correctAnswer: 0,
      explanation: "The Niger River is Nigeria's largest river and the third longest river in Africa. It flows through several West African countries and is a major source of water and transportation.",
      category: "current-affairs",
      difficulty: "medium"
    }
  ]
};

// Get all quiz categories
export const getQuizCategories = () => {
  return quizCategories;
};

// Get questions for a specific category
export const getQuizQuestions = (categoryId) => {
  return quizQuestions[categoryId] || [];
};

// Get a random quiz (10 questions from a category)
export const getRandomQuiz = (categoryId) => {
  const questions = getQuizQuestions(categoryId);
  
  // Use a more robust shuffling algorithm (Fisher-Yates shuffle)
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Return 10 questions, or all questions if less than 10
  return shuffled.slice(0, Math.min(10, shuffled.length));
};

// Save quiz result to user's profile
export const saveQuizResult = async (userId, quizData) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentQuizProgress = userData.quizProgress || {
        totalQuizzes: 0,
        completedQuizzes: 0,
        averageScore: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        quizHistory: []
      };
      
      // Calculate new statistics
      const newTotalQuizzes = currentQuizProgress.totalQuizzes + 1;
      const newCompletedQuizzes = currentQuizProgress.completedQuizzes + 1;
      const newTotalQuestions = currentQuizProgress.totalQuestions + quizData.totalQuestions;
      const newCorrectAnswers = currentQuizProgress.correctAnswers + quizData.correctAnswers;
      const newAverageScore = Math.round((newCorrectAnswers / newTotalQuestions) * 100);
      
      // Add to quiz history
      const quizHistory = [
        {
          id: Date.now(),
          category: quizData.category,
          score: quizData.score,
          totalQuestions: quizData.totalQuestions,
          correctAnswers: quizData.correctAnswers,
          completedAt: serverTimestamp(),
          answers: quizData.answers // Store user's answers for review
        },
        ...(currentQuizProgress.quizHistory || []).slice(0, 19) // Keep last 20 quizzes
      ];
      
      await updateDoc(userRef, {
        quizProgress: {
          totalQuizzes: newTotalQuizzes,
          completedQuizzes: newCompletedQuizzes,
          averageScore: newAverageScore,
          totalQuestions: newTotalQuestions,
          correctAnswers: newCorrectAnswers,
          quizHistory: quizHistory
        }
      });
      
      return { success: true, message: "Quiz result saved successfully" };
    }
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw error;
  }
};

// Get user's quiz progress
export const getUserQuizProgress = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data().quizProgress || {
        totalQuizzes: 0,
        completedQuizzes: 0,
        averageScore: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        quizHistory: []
      };
    }
    
    return {
      totalQuizzes: 0,
      completedQuizzes: 0,
      averageScore: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      quizHistory: []
    };
  } catch (error) {
    console.error("Error getting user quiz progress:", error);
    throw error;
  }
};

// Get user's quiz history
export const getUserQuizHistory = async (userId) => {
  try {
    const progress = await getUserQuizProgress(userId);
    return progress.quizHistory || [];
  } catch (error) {
    console.error("Error getting user quiz history:", error);
    throw error;
  }
};

// Calculate quiz score
export const calculateQuizScore = (answers, questions) => {
  let correctAnswers = 0;
  const totalQuestions = questions.length;
  
  answers.forEach((answer, index) => {
    // Handle null/undefined answers
    if (answer && answer.selectedAnswer !== null && answer.selectedAnswer !== undefined) {
      if (answer.selectedAnswer === questions[index].correctAnswer) {
        correctAnswers++;
      }
    }
  });
  
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  
  return {
    score,
    correctAnswers,
    totalQuestions,
    answers: answers.map((answer, index) => ({
      ...answer,
      question: questions[index],
      isCorrect: answer && answer.selectedAnswer !== null && answer.selectedAnswer !== undefined 
        ? answer.selectedAnswer === questions[index].correctAnswer 
        : false
    }))
  };
};
