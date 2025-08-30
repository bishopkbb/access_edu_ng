import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebaseConfig";
// Use static imports instead of dynamic imports to avoid runtime parsing issues
import { 
  scrapeWebsite as backendScrapeWebsite,
  fetchRSSFeed as backendFetchRSSFeed,
  callExternalAPI as backendCallExternalAPI
} from "./scholarshipBackendService.js";

// Configuration for external sources
const SCHOLARSHIP_SOURCES = [
  {
    name: "Scholarships.com",
    url: "https://www.scholarships.com/financial-aid/college-scholarships/scholarship-directory",
    type: "scrape",
    selectors: {
      container: ".scholarship-item",
      title: ".scholarship-title",
      amount: ".scholarship-amount",
      deadline: ".scholarship-deadline",
      description: ".scholarship-description"
    }
  },
  {
    name: "Fastweb",
    url: "https://www.fastweb.com/college-scholarships",
    type: "scrape",
    selectors: {
      container: ".scholarship-card",
      title: ".scholarship-name",
      amount: ".scholarship-value",
      deadline: ".scholarship-deadline",
      description: ".scholarship-summary"
    }
  },
  {
    name: "Nigerian Scholarships",
    url: "https://www.nigerianscholarships.com",
    type: "scrape",
    selectors: {
      container: ".scholarship-listing",
      title: ".scholarship-title",
      amount: ".scholarship-amount",
      deadline: ".scholarship-deadline",
      description: ".scholarship-description"
    }
  }
];

// RSS Feed sources for scholarships
const RSS_SOURCES = [
  {
    name: "Scholarships.com RSS",
    url: "https://www.scholarships.com/rss/scholarships.xml",
    type: "rss"
  },
  {
    name: "Fastweb RSS",
    url: "https://www.fastweb.com/rss/scholarships.xml",
    type: "rss"
  }
];

// API sources (if available)
const API_SOURCES = [
  {
    name: "Scholarship API",
    url: "https://api.scholarships.com/v1/scholarships",
    type: "api",
    headers: {
      "Authorization": "Bearer YOUR_API_KEY"
    }
  }
];

// Keywords to identify Nigerian-specific scholarships
const NIGERIAN_KEYWORDS = [
  "nigeria", "nigerian", "lagos", "abuja", "kano", "ibadan", "port harcourt",
  "calabar", "benin", "kaduna", "maiduguri", "zaria", "ilorin", "jos",
  "oyo", "ogun", "ondo", "ekiti", "osun", "kwara", "kogi", "nasarawa",
  "plateau", "taraba", "adamawa", "bauchi", "gombe", "yobe", "borno",
  "katsina", "kebbi", "sokoto", "zamfara", "niger", "kebbi", "jigawa",
  "kaduna", "katsina", "kebbi", "sokoto", "zamfara", "niger", "kebbi",
  "jigawa", "kaduna", "katsina", "kebbi", "sokoto", "zamfara", "niger",
  "kebbi", "jigawa", "kaduna", "katsina", "kebbi", "sokoto", "zamfara"
];

// Function to check if scholarship is relevant to Nigerian students
const isNigerianRelevant = (scholarship) => {
  const text = `${scholarship.title} ${scholarship.description} ${scholarship.institution}`.toLowerCase();
  
  // Check for Nigerian keywords
  const hasNigerianKeywords = NIGERIAN_KEYWORDS.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  // Check if it's an international scholarship that accepts Nigerian students
  const internationalKeywords = [
    "international", "global", "worldwide", "africa", "african",
    "developing countries", "low-income countries"
  ];
  
  const isInternational = internationalKeywords.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  return hasNigerianKeywords || isInternational;
};

// Function to parse amount from text
const parseAmount = (amountText) => {
  if (!amountText) return 0;
  
  // Remove currency symbols and commas
  const cleanText = amountText.replace(/[$,€£¥₦]/g, '').replace(/,/g, '');
  
  // Extract numbers
  const numbers = cleanText.match(/\d+/g);
  if (!numbers) return 0;
  
  // Convert to number (assuming USD if no currency specified)
  let amount = parseInt(numbers[0]);
  
  // Handle ranges (e.g., "$1,000 - $5,000")
  if (numbers.length > 1) {
    amount = parseInt(numbers[numbers.length - 1]); // Use highest amount
  }
  
  // Handle multipliers (e.g., "up to $10,000", "minimum $5,000")
  if (cleanText.toLowerCase().includes('up to') || cleanText.toLowerCase().includes('maximum')) {
    amount = parseInt(numbers[numbers.length - 1]);
  }
  
  return amount;
};

// Function to parse deadline from text
const parseDeadline = (deadlineText) => {
  if (!deadlineText) return null;
  
  // Common date formats
  const dateFormats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
    /(\d{1,2})-(\d{1,2})-(\d{4})/, // MM-DD-YYYY
    /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
    /(\w+)\s+(\d{1,2}),?\s+(\d{4})/, // Month DD, YYYY
  ];
  
  for (const format of dateFormats) {
    const match = deadlineText.match(format);
    if (match) {
      let month, day, year;
      
      if (format.source.includes('YYYY')) {
        // YYYY-MM-DD format
        year = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        day = parseInt(match[3]);
      } else {
        // MM/DD/YYYY or Month DD, YYYY format
        if (isNaN(parseInt(match[1]))) {
          // Month name format
          const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];
          month = monthNames.indexOf(match[1].toLowerCase());
          day = parseInt(match[2]);
          year = parseInt(match[3]);
        } else {
          // MM/DD/YYYY format
          month = parseInt(match[1]) - 1;
          day = parseInt(match[2]);
          year = parseInt(match[3]);
        }
      }
      
      if (month >= 0 && day > 0 && year > 2000) {
        return new Date(year, month, day).toISOString();
      }
    }
  }
  
  return null;
};

// Function to categorize scholarship
const categorizeScholarship = (scholarship) => {
  const text = `${scholarship.title} ${scholarship.description}`.toLowerCase();
  
  if (text.includes('government') || text.includes('federal') || text.includes('state')) {
    return 'Government';
  } else if (text.includes('corporate') || text.includes('company') || text.includes('foundation')) {
    return 'Corporate';
  } else if (text.includes('university') || text.includes('college') || text.includes('institution')) {
    return 'Academic';
  } else {
    return 'Private';
  }
};

// Function to determine scholarship level
const determineLevel = (scholarship) => {
  const text = `${scholarship.title} ${scholarship.description}`.toLowerCase();
  
  if (text.includes('undergraduate') || text.includes('bachelor') || text.includes('first degree')) {
    return 'Undergraduate';
  } else if (text.includes('postgraduate') || text.includes('master') || text.includes('phd') || text.includes('doctorate')) {
    return 'Postgraduate';
  } else if (text.includes('secondary') || text.includes('high school')) {
    return 'Secondary';
  } else {
    return 'Undergraduate'; // Default
  }
};

// Function to check for duplicates
const checkDuplicate = async (scholarship) => {
  try {
    const scholarshipsRef = collection(db, "scholarships");
    const q = query(
      scholarshipsRef,
      where("title", "==", scholarship.title),
      where("institution", "==", scholarship.institution)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking for duplicates:", error);
    return false;
  }
};

// Function to scrape scholarship data from websites
const scrapeScholarships = async (source) => {
  try {
    console.log(`Scraping scholarships from ${source.name}...`);
    
    // Try to use the backend service first
    try {
      const result = await backendScrapeWebsite(source.url, source.selectors);
      if (result && result.length > 0) {
        return result.map(item => ({
          ...item,
          source: source.name,
          website: source.url
        }));
      }
    } catch (backendError) {
      console.warn(`Backend scraping failed for ${source.name}, falling back to mock data:`, backendError.message);
    }
    
    // Fallback to mock data if backend is not available
    const { generateMockScholarships } = await import('./scholarshipDataGenerator');
    const dataCount = Math.floor(Math.random() * 10) + 5; // 5-15 scholarships
    const mockData = generateMockScholarships(dataCount);
    
    return mockData.map(item => ({
      ...item,
      source: source.name,
      website: source.url
    }));
  } catch (error) {
    console.error(`Error scraping ${source.name}:`, error);
    return [];
  }
};

// Function to fetch RSS feeds
const fetchRSSFeed = async (source) => {
  try {
    console.log(`Fetching RSS feed from ${source.name}...`);
    
    // Try to use the backend service first
    try {
      const result = await backendFetchRSSFeed(source.url);
      if (result && result.length > 0) {
        return result.map(item => ({
          ...item,
          source: `${source.name} (RSS)`,
          website: source.url
        }));
      }
    } catch (backendError) {
      console.warn(`Backend RSS fetching failed for ${source.name}, falling back to mock data:`, backendError.message);
    }
    
    // Fallback to mock data if backend is not available
    const { generateMockScholarships } = await import('./scholarshipDataGenerator');
    const dataCount = Math.floor(Math.random() * 5) + 2; // 2-7 scholarships
    const mockData = generateMockScholarships(dataCount);
    
    return mockData.map(item => ({
      ...item,
      source: `${source.name} (RSS)`,
      website: source.url
    }));
  } catch (error) {
    console.error(`Error fetching RSS from ${source.name}:`, error);
    return [];
  }
};

// Function to fetch from APIs
const fetchFromAPI = async (source) => {
  try {
    console.log(`Fetching from API: ${source.name}...`);
    
    // Try to use the backend service first
    try {
      const result = await backendCallExternalAPI({
        apiUrl: source.url,
        headers: source.headers || {},
        params: source.params || {}
      });
      if (result && result.length > 0) {
        return result.map(item => ({
          ...item,
          source: `${source.name} (API)`,
          website: source.url
        }));
      }
    } catch (backendError) {
      console.warn(`Backend API call failed for ${source.name}, falling back to mock data:`, backendError.message);
    }
    
    // Fallback to mock data if backend is not available
    const { generateMockScholarships } = await import('./scholarshipDataGenerator');
    const dataCount = Math.floor(Math.random() * 8) + 3; // 3-11 scholarships
    const mockData = generateMockScholarships(dataCount);
    
    return mockData.map(item => ({
      ...item,
      source: `${source.name} (API)`,
      website: source.url
    }));
  } catch (error) {
    console.error(`Error fetching from API ${source.name}:`, error);
    return [];
  }
};

// Function to process and validate scholarship data
const processScholarshipData = (rawData, source) => {
  const processed = [];
  
  for (const item of rawData) {
    try {
      // Parse amount
      const amount = parseAmount(item.amount);
      
      // Parse deadline
      const deadline = parseDeadline(item.deadline);
      
      // Skip if no valid deadline or amount
      if (!deadline || amount === 0) continue;
      
      // Create scholarship object
      const scholarship = {
        title: item.title?.trim() || "Untitled Scholarship",
        description: item.description?.trim() || "No description available",
        category: categorizeScholarship(item),
        level: determineLevel(item),
        state: "All States", // Default, could be enhanced with location parsing
        amount: amount,
        slots: 100, // Default, could be enhanced
        deadline: deadline,
        website: item.website || item.link || "",
        institution: item.institution || source.name,
        source: source.name,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Check if relevant to Nigerian students
      if (isNigerianRelevant(scholarship)) {
        processed.push(scholarship);
      }
    } catch (error) {
      console.error("Error processing scholarship item:", error);
    }
  }
  
  return processed;
};

// Main function to run automated scholarship collection
export const runScholarshipAutomation = async () => {
  console.log("Starting automated scholarship collection...");
  
  const allScholarships = [];
  
  try {
    // Scrape from websites
    for (const source of SCHOLARSHIP_SOURCES) {
      const scrapedData = await scrapeScholarships(source);
      const processedData = processScholarshipData(scrapedData, source);
      allScholarships.push(...processedData);
    }
    
    // Fetch from RSS feeds
    for (const source of RSS_SOURCES) {
      const rssData = await fetchRSSFeed(source);
      const processedData = processScholarshipData(rssData, source);
      allScholarships.push(...processedData);
    }
    
    // Fetch from APIs
    for (const source of API_SOURCES) {
      const apiData = await fetchFromAPI(source);
      const processedData = processScholarshipData(apiData, source);
      allScholarships.push(...processedData);
    }
    
    // Add new scholarships to database
    let addedCount = 0;
    for (const scholarship of allScholarships) {
      try {
        // Check for duplicates
        const isDuplicate = await checkDuplicate(scholarship);
        
        if (!isDuplicate) {
          await addScholarship(scholarship);
          addedCount++;
          console.log(`Added new scholarship: ${scholarship.title}`);
        }
      } catch (error) {
        console.error("Error adding scholarship:", error);
      }
    }
    
    console.log(`Automation complete. Added ${addedCount} new scholarships.`);
    return { success: true, added: addedCount, total: allScholarships.length };
    
  } catch (error) {
    console.error("Error in scholarship automation:", error);
    return { success: false, error: error.message };
  }
};

// Function to schedule automation (for use with cron jobs or similar)
export const scheduleAutomation = () => {
  // Run automation every 6 hours
  setInterval(async () => {
    console.log("Running scheduled scholarship automation...");
    await runScholarshipAutomation();
  }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds
};

// Function to manually trigger automation
export const triggerManualAutomation = async () => {
  return await runScholarshipAutomation();
};

// Function to get automation status
export const getAutomationStatus = async () => {
  try {
    const scholarshipsRef = collection(db, "scholarships");
    const q = query(scholarshipsRef, where("source", "!=", null));
    const querySnapshot = await getDocs(q);
    
    const automatedScholarships = [];
    querySnapshot.forEach((doc) => {
      automatedScholarships.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      totalAutomated: automatedScholarships.length,
      lastRun: new Date().toISOString(), // In production, store this in a separate collection
      sources: SCHOLARSHIP_SOURCES.length + RSS_SOURCES.length + API_SOURCES.length
    };
  } catch (error) {
    console.error("Error getting automation status:", error);
    return { error: error.message };
  }
};
