const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const parser = new Parser();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

const rateLimiterMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000)
    });
  }
};

app.use(rateLimiterMiddleware);

// Scholarship sources configuration
const SCHOLARSHIP_SOURCES = [
  {
    name: "Scholarships.com",
    url: "https://www.scholarships.com/financial-aid/college-scholarships/scholarship-directory",
    type: "scrape",
    selectors: {
      container: ".scholarship-item, .scholarship-card",
      title: ".scholarship-title, .scholarship-name, h3, h4",
      amount: ".scholarship-amount, .scholarship-value, .amount",
      deadline: ".scholarship-deadline, .deadline, .due-date",
      description: ".scholarship-description, .description, p"
    }
  },
  {
    name: "Fastweb",
    url: "https://www.fastweb.com/college-scholarships",
    type: "scrape",
    selectors: {
      container: ".scholarship-card, .scholarship-item",
      title: ".scholarship-name, .title, h3",
      amount: ".scholarship-value, .amount, .value",
      deadline: ".scholarship-deadline, .deadline",
      description: ".scholarship-summary, .description"
    }
  },
  {
    name: "Nigerian Scholarships",
    url: "https://www.nigerianscholarships.com",
    type: "scrape",
    selectors: {
      container: ".scholarship-listing, .scholarship-item, article",
      title: ".scholarship-title, .title, h2, h3",
      amount: ".scholarship-amount, .amount",
      deadline: ".scholarship-deadline, .deadline",
      description: ".scholarship-description, .description, .content"
    }
  }
];

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

// Utility functions
const parseAmount = (amountText) => {
  if (!amountText) return 0;
  const cleanText = amountText.replace(/[$,€£¥₦]/g, '').replace(/,/g, '');
  const numbers = cleanText.match(/\d+/g);
  if (!numbers) return 0;
  let amount = parseInt(numbers[0]);
  if (numbers.length > 1) {
    amount = parseInt(numbers[numbers.length - 1]);
  }
  return amount;
};

const parseDeadline = (deadlineText) => {
  if (!deadlineText) return null;
  const dateFormats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{1,2})-(\d{1,2})-(\d{4})/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    /(\w+)\s+(\d{1,2}),?\s+(\d{4})/,
  ];
  
  for (const format of dateFormats) {
    const match = deadlineText.match(format);
    if (match) {
      let month, day, year;
      if (format.source.includes('YYYY')) {
        year = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        day = parseInt(match[3]);
      } else {
        if (isNaN(parseInt(match[1]))) {
          const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];
          month = monthNames.indexOf(match[1].toLowerCase());
          day = parseInt(match[2]);
          year = parseInt(match[3]);
        } else {
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

const isNigerianRelevant = (scholarship) => {
  const nigerianKeywords = [
    "nigeria", "nigerian", "lagos", "abuja", "kano", "ibadan", "port harcourt",
    "calabar", "benin", "kaduna", "maiduguri", "zaria", "ilorin", "jos",
    "oyo", "ogun", "ondo", "ekiti", "osun", "kwara", "kogi", "nasarawa"
  ];
  
  const internationalKeywords = [
    "international", "global", "worldwide", "africa", "african",
    "developing countries", "low-income countries"
  ];
  
  const text = `${scholarship.title} ${scholarship.description}`.toLowerCase();
  
  const hasNigerianKeywords = nigerianKeywords.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  const isInternational = internationalKeywords.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  return hasNigerianKeywords || isInternational;
};

// Web scraping function
const scrapeWebsite = async (url, selectors) => {
  try {
    console.log(`Scraping: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const scholarships = [];
    
    $(selectors.container).each((index, element) => {
      try {
        const title = $(element).find(selectors.title).first().text().trim();
        const amount = $(element).find(selectors.amount).first().text().trim();
        const deadline = $(element).find(selectors.deadline).first().text().trim();
        const description = $(element).find(selectors.description).first().text().trim();
        
        if (title && description) {
          const scholarship = {
            title,
            description,
            amount: parseAmount(amount),
            deadline: parseDeadline(deadline),
            website: url,
            source: 'Web Scraping'
          };
          
          if (isNigerianRelevant(scholarship)) {
            scholarships.push(scholarship);
          }
        }
      } catch (error) {
        console.error(`Error parsing scholarship item ${index}:`, error);
      }
    });
    
    console.log(`Found ${scholarships.length} relevant scholarships from ${url}`);
    return scholarships;
    
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return [];
  }
};

// RSS parsing function
const parseRSSFeed = async (url) => {
  try {
    console.log(`Parsing RSS: ${url}`);
    
    const feed = await parser.parseURL(url);
    const scholarships = [];
    
    feed.items.forEach((item) => {
      try {
        const scholarship = {
          title: item.title || 'Untitled Scholarship',
          description: item.contentSnippet || item.content || 'No description available',
          amount: parseAmount(item.content || ''),
          deadline: parseDeadline(item.pubDate || ''),
          website: item.link || url,
          source: 'RSS Feed'
        };
        
        if (isNigerianRelevant(scholarship)) {
          scholarships.push(scholarship);
        }
      } catch (error) {
        console.error('Error parsing RSS item:', error);
      }
    });
    
    console.log(`Found ${scholarships.length} relevant scholarships from RSS: ${url}`);
    return scholarships;
    
  } catch (error) {
    console.error(`Error parsing RSS ${url}:`, error.message);
    return [];
  }
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Fetch scholarships from external sources
app.post('/api/scholarships/fetch-external', async (req, res) => {
  try {
    const { sourceType = 'all' } = req.body;
    let allScholarships = [];
    
    if (sourceType === 'all' || sourceType === 'scrape') {
      for (const source of SCHOLARSHIP_SOURCES) {
        const scrapedData = await scrapeWebsite(source.url, source.selectors);
        allScholarships.push(...scrapedData);
      }
    }
    
    if (sourceType === 'all' || sourceType === 'rss') {
      for (const source of RSS_SOURCES) {
        const rssData = await parseRSSFeed(source.url);
        allScholarships.push(...rssData);
      }
    }
    
    res.json({
      success: true,
      count: allScholarships.length,
      scholarships: allScholarships
    });
    
  } catch (error) {
    console.error('Error fetching external scholarships:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Scrape specific website
app.post('/api/scholarships/scrape', async (req, res) => {
  try {
    const { url, selectors } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    const scholarships = await scrapeWebsite(url, selectors || SCHOLARSHIP_SOURCES[0].selectors);
    
    res.json({
      success: true,
      count: scholarships.length,
      scholarships
    });
    
  } catch (error) {
    console.error('Error scraping website:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Parse RSS feed
app.post('/api/scholarships/rss', async (req, res) => {
  try {
    const { feedUrl } = req.body;
    
    if (!feedUrl) {
      return res.status(400).json({
        success: false,
        error: 'Feed URL is required'
      });
    }
    
    const scholarships = await parseRSSFeed(feedUrl);
    
    res.json({
      success: true,
      count: scholarships.length,
      scholarships
    });
    
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Call external API
app.post('/api/scholarships/external-api', async (req, res) => {
  try {
    const { apiUrl, headers = {}, params = {} } = req.body;
    
    if (!apiUrl) {
      return res.status(400).json({
        success: false,
        error: 'API URL is required'
      });
    }
    
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'AccessEdu-Scholarship-Bot/1.0',
        ...headers
      },
      params,
      timeout: 10000
    });
    
    // Process the API response
    const rawData = response.data;
    const scholarships = [];
    
    // Handle different API response formats
    const items = Array.isArray(rawData) ? rawData : 
                  rawData.items || rawData.scholarships || rawData.data || [];
    
    items.forEach(item => {
      try {
        const scholarship = {
          title: item.title || item.name || 'Untitled Scholarship',
          description: item.description || item.summary || 'No description available',
          amount: parseAmount(item.amount || item.value || ''),
          deadline: parseDeadline(item.deadline || item.due_date || ''),
          website: item.url || item.link || item.source_url || '',
          source: 'External API'
        };
        
        if (isNigerianRelevant(scholarship)) {
          scholarships.push(scholarship);
        }
      } catch (error) {
        console.error('Error processing API item:', error);
      }
    });
    
    res.json({
      success: true,
      count: scholarships.length,
      scholarships
    });
    
  } catch (error) {
    console.error('Error calling external API:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get automation logs
app.get('/api/scholarships/automation-logs', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    // In a real implementation, you'd store logs in a database
    const logs = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        action: 'Web Scraping',
        source: 'Scholarships.com',
        status: 'success',
        count: 15,
        duration: 2500
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        action: 'RSS Parsing',
        source: 'Fastweb RSS',
        status: 'success',
        count: 8,
        duration: 1200
      }
    ].slice(0, parseInt(limit));
    
    res.json({
      success: true,
      logs
    });
    
  } catch (error) {
    console.error('Error getting automation logs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get automation statistics
app.get('/api/scholarships/automation-stats', (req, res) => {
  try {
    const stats = {
      totalSources: SCHOLARSHIP_SOURCES.length + RSS_SOURCES.length,
      lastRun: new Date().toISOString(),
      successRate: 85.5,
      averageResponseTime: 2.3,
      totalScholarshipsFound: 1250,
      activeSources: 8
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Error getting automation stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update automation configuration
app.put('/api/scholarships/automation-config', (req, res) => {
  try {
    const { schedule, enabled, sources } = req.body;
    
    // In a real implementation, you'd save this to a database
    console.log('Updating automation config:', { schedule, enabled, sources });
    
    res.json({
      success: true,
      message: 'Configuration updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating automation config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current automation configuration
app.get('/api/scholarships/automation-config', (req, res) => {
  try {
    const config = {
      schedule: '0 */6 * * *', // Every 6 hours
      enabled: true,
      sources: {
        webScraping: true,
        rssFeeds: true,
        externalAPIs: true
      },
      retryAttempts: 3,
      timeout: 10000
    };
    
    res.json({
      success: true,
      config
    });
    
  } catch (error) {
    console.error('Error getting automation config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test a specific source
app.post('/api/scholarships/test-source', async (req, res) => {
  try {
    const { sourceConfig } = req.body;
    
    if (!sourceConfig || !sourceConfig.url) {
      return res.status(400).json({
        success: false,
        error: 'Source configuration with URL is required'
      });
    }
    
    let result;
    if (sourceConfig.type === 'rss') {
      result = await parseRSSFeed(sourceConfig.url);
    } else {
      result = await scrapeWebsite(sourceConfig.url, sourceConfig.selectors);
    }
    
    res.json({
      success: true,
      source: sourceConfig.name,
      count: result.length,
      sample: result.slice(0, 3)
    });
    
  } catch (error) {
    console.error('Error testing source:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Trigger automation for a specific source
app.post('/api/scholarships/trigger-source', async (req, res) => {
  try {
    const { sourceName } = req.body;
    
    if (!sourceName) {
      return res.status(400).json({
        success: false,
        error: 'Source name is required'
      });
    }
    
    // Find the source configuration
    const source = [...SCHOLARSHIP_SOURCES, ...RSS_SOURCES]
      .find(s => s.name === sourceName);
    
    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Source not found'
      });
    }
    
    let result;
    if (source.type === 'rss') {
      result = await parseRSSFeed(source.url);
    } else {
      result = await scrapeWebsite(source.url, source.selectors);
    }
    
    res.json({
      success: true,
      source: sourceName,
      count: result.length,
      scholarships: result
    });
    
  } catch (error) {
    console.error('Error triggering source automation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Scholarship Backend Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Schedule automated runs (every 6 hours)
cron.schedule('0 */6 * * *', async () => {
  console.log('Running scheduled scholarship automation...');
  
  try {
    // Run web scraping
    for (const source of SCHOLARSHIP_SOURCES) {
      await scrapeWebsite(source.url, source.selectors);
    }
    
    // Run RSS parsing
    for (const source of RSS_SOURCES) {
      await parseRSSFeed(source.url);
    }
    
    console.log('Scheduled automation completed successfully');
  } catch (error) {
    console.error('Scheduled automation failed:', error);
  }
});

module.exports = app;

