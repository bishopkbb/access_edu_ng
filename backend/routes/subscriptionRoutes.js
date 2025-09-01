

// ============= FILE: server.js =============
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const authRoutes = require('./routes/authRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware
app.use(logger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// Dashboard-compatible subscription endpoints
app.use('/api/subscriptions', subscriptionRoutes);

// Custom subscription endpoints (backward compatibility)
app.use('/access_edu_ng/api/subscription', subscriptionRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard endpoints: http://localhost:${PORT}/api/subscriptions`);
  console.log(`🔧 Custom endpoints: http://localhost:${PORT}/access_edu_ng/api/subscription`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;

// ============= FILE: config/database.js =============
const mysql = require('mysql2/promise');

class Database {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000
    });
  }

  async query(sql, params = []) {
    try {
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async getConnection() {
    return await this.pool.getConnection();
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = new Database();

// ============= FILE: middleware/errorHandler.js =============
const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err.stack);

  // Default error
  let error = { ...err };
  error.message = err.message;

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // MySQL connection errors
  if (err.code === 'ECONNREFUSED') {
    const message = 'Database connection failed';
    error = { message, statusCode: 500 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;

// ============= FILE: middleware/logger.js =============
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`[${timestamp}] ${method} ${url} - ${ip}`);

  // Log response time
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${method} ${url} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

module.exports = logger;

// ============= FILE: middleware/auth.js =============
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid token.'
    });
  }
};

module.exports = { authenticate };

// ============= FILE: routes/authRoutes.js =============
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('../config/database');

const router = express.Router();

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await Database.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await Database.query(
      `INSERT INTO users (email, password, firstName, lastName, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [email, hashedPassword, firstName, lastName]
    );

    // Generate JWT
    const token = jwt.sign(
      { userId: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      data: {
        userId: result.insertId,
        email,
        firstName,
        lastName,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const users = await Database.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;

// ============= FILE: services/SubscriptionService.js =============
const axios = require('axios');

class SubscriptionService {
  constructor() {
    this.paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    this.paystackBaseUrl = 'https://api.paystack.co';
    
    this.headers = {
      'Authorization': `Bearer ${this.paystackSecretKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Initialize a subscription with Paystack
   */
  async initializeSubscription({ email, planCode, amount, metadata = {} }) {
    try {
      const response = await axios.post(
        `${this.paystackBaseUrl}/transaction/initialize`,
        {
          email,
          amount: amount * 100, // Paystack expects amount in kobo
          plan: planCode,
          metadata,
          callback_url: metadata.callback_url || process.env.CALLBACK_URL
        },
        { headers: this.headers }
      );

      if (!response.data.status) {
        return {
          success: false,
          error: response.data.message || 'Failed to initialize subscription'
        };
      }

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Paystack initialization error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to initialize subscription'
      };
    }
  }

  /**
   * Verify a transaction
   */
  async verifyTransaction(reference) {
    try {
      const response = await axios.get(
        `${this.paystackBaseUrl}/transaction/verify/${reference}`,
        { headers: this.headers }
      );

      if (!response.data.status) {
        return {
          success: false,
          error: response.data.message || 'Failed to verify transaction'
        };
      }

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Transaction verification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to verify transaction'
      };
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionCode) {
    try {
      const response = await axios.post(
        `${this.paystackBaseUrl}/subscription/disable`,
        {
          code: subscriptionCode,
          token: subscriptionCode
        },
        { headers: this.headers }
      );

      if (!response.data.status) {
        return {
          success: false,
          error: response.data.message || 'Failed to cancel subscription'
        };
      }

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Subscription cancellation error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to cancel subscription'
      };
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionCode) {
    try {
      const response = await axios.get(
        `${this.paystackBaseUrl}/subscription/${subscriptionCode}`,
        { headers: this.headers }
      );

      if (!response.data.status) {
        return {
          success: false,
          error: response.data.message || 'Failed to get subscription'
        };
      }

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get subscription error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get subscription'
      };
    }
  }
}

module.exports = SubscriptionService;

// ============= FILE: services/SubscriptionDatabaseService.js =============
const Database = require('../config/database');

class SubscriptionDatabaseService {
  /**
   * Create or update a subscription
   */
  async createOrUpdateSubscription(subscriptionData) {
    try {
      const {
        userId, email, subscriptionCode, customerCode, planCode,
        planName, amount, currency, status, startDate, nextPaymentDate, metadata
      } = subscriptionData;

      // Check if subscription exists
      const existingSubscription = await Database.query(
        'SELECT id FROM subscriptions WHERE subscriptionCode = ?',
        [subscriptionCode]
      );

      let result;
      if (existingSubscription.length > 0) {
        // Update existing subscription
        result = await Database.query(
          `UPDATE subscriptions SET 
           status = ?, nextPaymentDate = ?, metadata = ?, updatedAt = NOW()
           WHERE subscriptionCode = ?`,
          [status, nextPaymentDate, JSON.stringify(metadata), subscriptionCode]
        );
      } else {
        // Create new subscription
        result = await Database.query(
          `INSERT INTO subscriptions 
           (userId, email, subscriptionCode, customerCode, planCode, planName, 
            amount, currency, status, startDate, nextPaymentDate, metadata, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [userId, email, subscriptionCode, customerCode, planCode, planName,
           amount, currency, status, startDate, nextPaymentDate, JSON.stringify(metadata)]
        );
      }

      return {
        success: true,
        data: { id: result.insertId || existingSubscription[0].id }
      };
    } catch (error) {
      console.error('Database error creating/updating subscription:', error);
      return {
        success: false,
        error: 'Failed to save subscription'
      };
    }
  }

  /**
   * Get user subscriptions
   */
  async getUserSubscriptions(userId) {
    try {
      const subscriptions = await Database.query(
        `SELECT s.*, p.name as planName, p.interval, p.features
         FROM subscriptions s
         LEFT JOIN subscription_plans p ON s.planCode = p.planCode
         WHERE s.userId = ?
         ORDER BY s.createdAt DESC`,
        [userId]
      );

      return {
        success: true,
        data: subscriptions.map(sub => ({
          ...sub,
          metadata: sub.metadata ? JSON.parse(sub.metadata) : {}
        }))
      };
    } catch (error) {
      console.error('Database error fetching user subscriptions:', error);
      return {
        success: false,
        error: 'Failed to fetch subscriptions'
      };
    }
  }

  /**
   * Get active subscription plans
   */
  async getActivePlans() {
    try {
      const plans = await Database.query(
        `SELECT * FROM subscription_plans 
         WHERE isActive = true 
         ORDER BY amount ASC`
      );

      return {
        success: true,
        data: plans.map(plan => ({
          ...plan,
          features: plan.features ? JSON.parse(plan.features) : []
        }))
      };
    } catch (error) {
      console.error('Database error fetching plans:', error);
      return {
        success: false,
        error: 'Failed to fetch subscription plans'
      };
    }
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(subscriptionCode, status) {
    try {
      const result = await Database.query(
        'UPDATE subscriptions SET status = ?, updatedAt = NOW() WHERE subscriptionCode = ?',
        [status, subscriptionCode]
      );

      if (result.affectedRows === 0) {
        return {
          success: false,
          error: 'Subscription not found'
        };
      }

      return {
        success: true,
        data: { subscriptionCode, status }
      };
    } catch (error) {
      console.error('Database error updating subscription status:', error);
      return {
        success: false,
        error: 'Failed to update subscription status'
      };
    }
  }

  /**
   * Log transaction
   */
  async logTransaction(transactionData) {
    try {
      const {
        reference, subscriptionCode, userId, amount, currency,
        status, channel, gatewayResponse, paidAt, metadata
      } = transactionData;

      await Database.query(
        `INSERT INTO transactions 
         (reference, subscriptionCode, userId, amount, currency, status, 
          channel, gatewayResponse, paidAt, metadata, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [reference, subscriptionCode, userId, amount, currency, status,
         channel, gatewayResponse, paidAt, JSON.stringify(metadata)]
      );

      return { success: true };
    } catch (error) {
      console.error('Database error logging transaction:', error);
      return {
        success: false,
        error: 'Failed to log transaction'
      };
    }
  }
}

module.exports = SubscriptionDatabaseService;