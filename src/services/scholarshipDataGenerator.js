// Scholarship Data Generator - Creates realistic mock data for Nigerian scholarships
// This simulates real scholarship opportunities until external APIs are connected

const NIGERIAN_STATES = [
  "Lagos", "Kano", "Kaduna", "Katsina", "Oyo", "Rivers", "Bauchi", "Jigawa", 
  "Imo", "Niger", "Borno", "Plateau", "Sokoto", "Gombe", "Kwara", "Cross River",
  "Kebbi", "Zamfara", "Yobe", "Kogi", "Ondo", "Edo", "Delta", "Nasarawa",
  "Akwa Ibom", "Taraba", "Adamawa", "Ekiti", "Osun", "Abuja", "Anambra", "Enugu",
  "Ebonyi", "Abia", "Kano", "Kaduna", "Katsina", "Kebbi", "Sokoto", "Zamfara"
];

const STUDY_FIELDS = [
  "Engineering", "Medicine", "Computer Science", "Business Administration", 
  "Agriculture", "Education", "Law", "Arts", "Social Sciences", "Natural Sciences",
  "Technology", "Environmental Science", "Public Health", "Economics", "Architecture"
];

const INSTITUTIONS = [
  "University of Lagos", "University of Ibadan", "Ahmadu Bello University", 
  "University of Nigeria", "Obafemi Awolowo University", "University of Benin",
  "Federal University of Technology", "Covenant University", "Babcock University",
  "Lagos State University", "Rivers State University", "Delta State University"
];

// Generate realistic scholarship data
export const generateMockScholarships = (count = 15) => {
  const scholarships = [];
  const currentDate = new Date();
  
  for (let i = 0; i < count; i++) {
    const scholarship = generateSingleScholarship(i, currentDate);
    scholarships.push(scholarship);
  }
  
  return scholarships;
};

const generateSingleScholarship = (index, currentDate) => {
  const types = [
    {
      name: "Government Scholarship",
      providers: ["Federal Government", "State Government", "TETFUND", "PTDF"],
      amounts: [500000, 750000, 1000000, 1500000],
      categories: ["Government"]
    },
    {
      name: "Corporate Scholarship", 
      providers: ["MTN Foundation", "Shell Nigeria", "Chevron", "NNPC", "Dangote Foundation"],
      amounts: [200000, 300000, 500000, 750000],
      categories: ["Corporate"]
    },
    {
      name: "University Scholarship",
      providers: INSTITUTIONS,
      amounts: [100000, 150000, 250000, 400000],
      categories: ["Academic"]
    },
    {
      name: "International Scholarship",
      providers: ["British Council", "US Embassy", "German Academic Exchange", "Commonwealth"],
      amounts: [1000000, 2000000, 3000000, 5000000],
      categories: ["International"]
    }
  ];
  
  const type = types[Math.floor(Math.random() * types.length)];
  const provider = type.providers[Math.floor(Math.random() * type.providers.length)];
  const amount = type.amounts[Math.floor(Math.random() * type.amounts.length)];
  const field = STUDY_FIELDS[Math.floor(Math.random() * STUDY_FIELDS.length)];
  const state = NIGERIAN_STATES[Math.floor(Math.random() * NIGERIAN_STATES.length)];
  
  // Generate realistic deadline (between 30 days and 6 months from now)
  const daysFromNow = Math.floor(Math.random() * 150) + 30;
  const deadline = new Date(currentDate.getTime() + (daysFromNow * 24 * 60 * 60 * 1000));
  
  const scholarship = {
    id: `mock-scholarship-${index + 1}`,
    title: generateScholarshipTitle(type.name, provider, field),
    description: generateDescription(type.name, provider, field, amount),
    category: type.categories[0],
    level: generateLevel(),
    state: Math.random() > 0.7 ? "All States" : state,
    amount: amount,
    slots: Math.floor(Math.random() * 200) + 50,
    deadline: deadline.toISOString(),
    website: generateWebsite(provider),
    institution: provider,
    eligibility: generateEligibility(field),
    source: "Mock Data Generator",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  return scholarship;
};

const generateScholarshipTitle = (type, provider, field) => {
  const titles = [
    `${provider} ${type} for ${field} Students`,
    `${field} ${type} Program`,
    `${provider} Undergraduate Scholarship in ${field}`,
    `${type} for Nigerian Students in ${field}`,
    `${provider} Academic Excellence Award`,
    `${field} Education Grant`,
    `${provider} Merit-Based Scholarship`,
    `${type} for Outstanding ${field} Students`
  ];
  
  return titles[Math.floor(Math.random() * titles.length)];
};

const generateDescription = (type, provider, field, amount) => {
  const descriptions = [
    `This ${type.toLowerCase()} program provides financial support of ₦${amount.toLocaleString()} to outstanding Nigerian students pursuing studies in ${field}. The scholarship covers tuition fees, accommodation, and a monthly stipend.`,
    `The ${provider} offers this comprehensive scholarship worth ₦${amount.toLocaleString()} to support ${field} students. Benefits include full tuition coverage, living expenses, and academic materials.`,
    `A merit-based ${type.toLowerCase()} of ₦${amount.toLocaleString()} designed to support Nigerian students in ${field}. The program includes mentorship opportunities and career development support.`,
    `This prestigious ${type.toLowerCase()} from ${provider} provides ₦${amount.toLocaleString()} in financial assistance for ${field} students. The program aims to develop future leaders in the field.`
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

const generateLevel = () => {
  const levels = ["Undergraduate", "Postgraduate", "PhD"];
  const weights = [0.6, 0.3, 0.1]; // 60% undergraduate, 30% postgraduate, 10% PhD
  
  const random = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < levels.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return levels[i];
    }
  }
  
  return "Undergraduate";
};

const generateWebsite = (provider) => {
  const domains = [
    "https://scholarships.ng",
    "https://nigerianscholarships.com", 
    "https://myschool.ng",
    "https://scholarship.com.ng",
    "https://education.gov.ng"
  ];
  
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const path = provider.toLowerCase().replace(/\s+/g, '-');
  
  return `${domain}/${path}`;
};

const generateEligibility = (field) => {
  const ageRange = Math.random() > 0.5 ? "18-25 years" : "18-30 years";
  const gpa = Math.random() > 0.7 ? "3.5/4.0" : "3.0/4.0";
  
  return `Nigerian citizen, ${ageRange}, minimum GPA of ${gpa}, studying ${field}, good academic standing`;
};

// Generate announcements for upcoming scholarships
export const generateMockAnnouncements = (count = 5) => {
  const announcements = [];
  const currentDate = new Date();
  
  for (let i = 0; i < count; i++) {
    const daysFromNow = Math.floor(Math.random() * 90) + 7; // 1 week to 3 months
    const expectedStart = new Date(currentDate.getTime() + (daysFromNow * 24 * 60 * 60 * 1000));
    
    const announcement = {
      title: `Upcoming: ${generateScholarshipTitle("Scholarship", "Various Providers", STUDY_FIELDS[Math.floor(Math.random() * STUDY_FIELDS.length)])}`,
      description: `A new scholarship opportunity will be opening soon. Stay tuned for more details about eligibility criteria and application process.`,
      expectedStart: expectedStart.toISOString(),
      category: ["Government", "Corporate", "Academic", "International"][Math.floor(Math.random() * 4)],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    announcements.push(announcement);
  }
  
  return announcements;
};

// Validate scholarship data structure
export const validateScholarshipData = (scholarship) => {
  const required = ['title', 'description', 'category', 'level', 'amount', 'deadline', 'institution'];
  const errors = [];
  
  required.forEach(field => {
    if (!scholarship[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  if (scholarship.amount && (isNaN(scholarship.amount) || scholarship.amount <= 0)) {
    errors.push('Amount must be a positive number');
  }
  
  if (scholarship.deadline && isNaN(new Date(scholarship.deadline).getTime())) {
    errors.push('Invalid deadline date');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Convert external API data to our format
export const transformExternalData = (externalData) => {
  return externalData.map(item => ({
    title: item.title || item.name || "Untitled Scholarship",
    description: item.description || item.summary || "No description available",
    category: categorizeExternal(item),
    level: determineLevelFromExternal(item),
    state: item.location || "All States",
    amount: parseAmountFromExternal(item.amount || item.value),
    slots: item.slots || 100,
    deadline: parseDeadlineFromExternal(item.deadline || item.due_date),
    website: item.url || item.link || item.source_url,
    institution: item.provider || item.organization || "Unknown",
    eligibility: item.eligibility || item.requirements || "Check website for details",
    source: "External API",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
};

const categorizeExternal = (item) => {
  const text = `${item.title} ${item.description} ${item.provider}`.toLowerCase();
  
  if (text.includes('government') || text.includes('federal') || text.includes('state')) {
    return 'Government';
  } else if (text.includes('corporate') || text.includes('company') || text.includes('foundation')) {
    return 'Corporate';
  } else if (text.includes('university') || text.includes('college') || text.includes('institution')) {
    return 'Academic';
  } else if (text.includes('international') || text.includes('global')) {
    return 'International';
  } else {
    return 'Private';
  }
};

const determineLevelFromExternal = (item) => {
  const text = `${item.title} ${item.description}`.toLowerCase();
  
  if (text.includes('undergraduate') || text.includes('bachelor')) {
    return 'Undergraduate';
  } else if (text.includes('postgraduate') || text.includes('master') || text.includes('phd')) {
    return 'Postgraduate';
  } else {
    return 'Undergraduate';
  }
};

const parseAmountFromExternal = (amountText) => {
  if (!amountText) return 100000;
  
  const numbers = amountText.toString().match(/\d+/g);
  if (!numbers) return 100000;
  
  return parseInt(numbers[0]) || 100000;
};

const parseDeadlineFromExternal = (deadlineText) => {
  if (!deadlineText) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    return futureDate.toISOString();
  }
  
  const parsed = new Date(deadlineText);
  if (isNaN(parsed.getTime())) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    return futureDate.toISOString();
  }
  
  return parsed.toISOString();
};

