import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  getUserDashboardData, 
  saveScholarship, 
  unsaveScholarship, 
  completeApplication,
  getUserPreferences,
  updateUserPreferences 
} from "../services/userDataService";
import { getNotifications } from "../services/profileService";
import { getActiveScholarships } from "../services/scholarshipService";
import LanguageSelector from "../components/LanguageSelector";
import { useTranslation } from "../context/TranslationContext";
import {
  Home,
  BookOpen,
  GraduationCap,
  MessageSquare,
  HelpCircle,
  Globe,
  Settings,
  LogOut,
  Search,
  Bell,
  Bookmark,
  CheckCircle,
  Users,
  MapPin,
  Clock,
  Filter,
  Moon,
  Sun,
  Menu,
  X,
  RefreshCw,
  Crown,
  Star,
  Zap,
  CreditCard
} from "lucide-react";

// Subscription service functions with enhanced error handling
const subscriptionService = {
  async initializePayment(email, amount, plan) {
    try {
      console.log('Initializing payment with data:', { email, amount, plan });
      
      const response = await fetch('/api/subscription/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: amount * 100, // Convert to kobo
          plan,
          callback_url: `${window.location.origin}/dashboard?payment=success`,
          metadata: {
            custom_fields: [
              {
                display_name: "Plan",
                variable_name: "plan",
                value: plan
              }
            ]
          }
        }),
      });

      console.log('Payment response status:', response.status);
      console.log('Payment response headers:', response.headers);

      // Check if response is ok first
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment initialization failed - Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Payment initialization failed'}`);
      }

      // Check if response has content
      const responseText = await response.text();
      console.log('Raw payment response:', responseText);
      
      if (!responseText) {
        throw new Error('Empty response from server');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      console.log('Parsed payment data:', data);
      return data;

    } catch (error) {
      console.error('Payment initialization error:', error);
      // Re-throw with more context
      throw new Error(`Payment initialization failed: ${error.message}`);
    }
  },

  async verifyPayment(reference) {
    try {
      console.log('Verifying payment with reference:', reference);
      
      const response = await fetch(`/api/subscription/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('Verification response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment verification failed - Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Payment verification failed'}`);
      }

      const responseText = await response.text();
      console.log('Raw verification response:', responseText);
      
      if (!responseText) {
        throw new Error('Empty response from verification endpoint');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error in verification:', parseError);
        throw new Error('Invalid JSON response from verification endpoint');
      }

      console.log('Parsed verification data:', data);
      return data;

    } catch (error) {
      console.error('Payment verification error:', error);
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  },

  async getUserSubscription(userId) {
    try {
      console.log('Getting subscription status for user:', userId);
      
      const response = await fetch(`/api/subscription/status/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('Subscription status response:', response.status);

      // If endpoint doesn't exist or returns 404, return null instead of throwing
      if (response.status === 404) {
        console.log('Subscription endpoint not found, assuming free user');
        return { isActive: false, plan: 'free' };
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Get subscription failed - Response:', errorText);
        // Don't throw error for subscription status, just return free user
        console.warn('Failed to get subscription status, assuming free user');
        return { isActive: false, plan: 'free' };
      }

      const responseText = await response.text();
      console.log('Raw subscription response:', responseText);
      
      if (!responseText) {
        console.log('Empty subscription response, assuming free user');
        return { isActive: false, plan: 'free' };
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error in subscription status:', parseError);
        console.warn('Invalid subscription response, assuming free user');
        return { isActive: false, plan: 'free' };
      }

      console.log('Parsed subscription data:', data);
      return data;

    } catch (error) {
      console.error('Get subscription error:', error);
      // Don't throw for subscription status, just assume free user
      console.warn('Error getting subscription status, assuming free user');
      return { isActive: false, plan: 'free' };
    }
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  
  // Enhanced state with subscription features
  const [error, setError] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [userSubscription, setUserSubscription] = useState(null);
  const [subscriptionError, setSubscriptionError] = useState(null);
  
  const [userDashboardData, setUserDashboardData] = useState({
    totalScholarships: 0,
    savedOpportunities: 0,
    savedScholarships: [],
    completedApplications: [],
    savedPrograms: [],
    profileCompleted: false,
    quizProgress: {
      totalQuizzes: 0,
      completedQuizzes: 0,
      averageScore: 0,
      totalQuestions: 0,
      correctAnswers: 0
    }
  });
  const [actualScholarshipCount, setActualScholarshipCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  // Subscription plans
  const subscriptionPlans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 2000,
      currency: '₦',
      interval: 'monthly',
      features: [
        'Access to 50+ scholarships',
        'Basic application tracking',
        'Email notifications',
        'Community forum access'
      ],
      color: 'bg-blue-500',
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 5000,
      currency: '₦',
      interval: 'monthly',
      features: [
        'Access to ALL scholarships',
        'Advanced application tracking',
        'Priority notifications',
        'Premium forum features',
        'Personalized recommendations',
        'Direct mentor support'
      ],
      color: 'bg-red-500',
      popular: true
    },
    {
      id: 'annual',
      name: 'Annual Premium',
      price: 50000,
      currency: '₦',
      interval: 'yearly',
      features: [
        'All Premium features',
        '2 months free',
        'Priority customer support',
        'Exclusive webinars',
        'Career guidance sessions'
      ],
      color: 'bg-purple-500',
      popular: false
    }
  ];

  // Load user subscription status
  const loadUserSubscription = useCallback(async () => {
    if (!user || user.isAnonymous) return;
    
    try {
      const subscription = await subscriptionService.getUserSubscription(user.uid);
      setUserSubscription(subscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  }, [user]);

  // Handle subscription payment with better error handling
  const handleSubscribe = async (plan) => {
    if (!user || user.isAnonymous) {
      navigate('/auth');
      return;
    }

    try {
      setSubscriptionLoading(true);
      setSubscriptionError(null);
      
      console.log('Starting subscription process for plan:', plan);
      console.log('User details:', { email: user.email, uid: user.uid });
      
      // Check if we're in development mode and APIs might not be ready
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isDevelopment) {
        console.log('Development mode detected - you may need to set up your backend APIs');
      }
      
      const paymentData = await subscriptionService.initializePayment(
        user.email,
        plan.price,
        plan.id
      );
      
      console.log('Payment initialization successful:', paymentData);
      
      // Check if we got the expected response format
      if (!paymentData) {
        throw new Error('No payment data received from server');
      }
      
      if (!paymentData.authorization_url) {
        console.error('Invalid payment response:', paymentData);
        throw new Error('No authorization URL received. Please check your backend configuration.');
      }
      
      console.log('Redirecting to Paystack:', paymentData.authorization_url);
      window.location.href = paymentData.authorization_url;
      
    } catch (error) {
      console.error('Subscription error details:', error);
      
      let errorMessage = error.message;
      
      // Provide more helpful error messages
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to payment service. Please check your internet connection and try again.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Payment service not found. Please contact support or try again later.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error occurred. Please try again in a few minutes.';
      } else if (error.message.includes('Empty response')) {
        errorMessage = 'Payment service is not responding properly. Please try again later.';
      } else if (error.message.includes('Invalid JSON')) {
        errorMessage = 'Payment service returned invalid data. Please contact support.';
      }
      
      setSubscriptionError(errorMessage);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // Check for payment success on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const paymentStatus = urlParams.get('payment');
    const reference = urlParams.get('reference');
    
    if (paymentStatus === 'success' && reference) {
      const verifyPayment = async () => {
        try {
          setLoading(true);
          const verification = await subscriptionService.verifyPayment(reference);
          
          if (verification.status === 'success') {
            // Refresh subscription status
            await loadUserSubscription();
            
            // Show success message
            setError(null);
            
            // Clean up URL
            navigate('/dashboard', { replace: true });
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          setError('Payment verification failed. Please contact support.');
        } finally {
          setLoading(false);
        }
      };
      
      verifyPayment();
    }
  }, [location.search, navigate, loadUserSubscription]);

  // Create a stable navigation handler using useCallback
  const handleSidebarNavigation = useCallback((itemKey) => {
    console.log("Navigating to:", itemKey);
    
    switch(itemKey) {
      case "home":
        break;
      case "scholarships":
        navigate("/scholarships");
        break;
      case "tvet":
        navigate("/tvet");
        break;
      case "forum":
        navigate("/forum");
        break;
      case "quizzes":
        navigate("/quiz");
        break;
      case "language":
        setShowLanguageSelector(true);
        break;
      case "settings":
        navigate("/settings");
        break;
      case "subscription":
        setShowSubscriptionModal(true);
        break;
      default:
        console.warn("Unknown navigation key:", itemKey);
    }
    
    setSidebarOpen(false);
  }, [navigate]);

  // Create sidebarItems with subscription option
  const sidebarItems = useMemo(() => {
    const items = [
      { icon: Home, label: t("Home"), active: true, key: "home" },
      { icon: BookOpen, label: t("Scholarships"), active: false, key: "scholarships" },
      { icon: GraduationCap, label: t("TVET"), active: false, key: "tvet" },
      { icon: MessageSquare, label: t("Community Forum"), active: false, key: "forum" },
      { icon: HelpCircle, label: t("Quizzes"), active: false, key: "quizzes" },
      { icon: Globe, label: t("Language"), active: false, key: "language" },
      { icon: Settings, label: t("Settings"), active: false, key: "settings" },
    ];

    // Add subscription item if user is not anonymous
    if (!user?.isAnonymous) {
      items.splice(-1, 0, { 
        icon: Crown, 
        label: userSubscription?.isActive ? "Manage Subscription" : "Upgrade to Premium", 
        active: false, 
        key: "subscription",
        premium: !userSubscription?.isActive
      });
    }

    return items;
  }, [t, user, userSubscription]);

  // Enhanced data loading with subscription data
  const loadUserData = useCallback(async () => {
    if (!user || user.isAnonymous) {
      console.log("User is anonymous or not logged in, skipping data load");
      return;
    }

    try {
      setRefreshing(true);
      setError(null);
      
      console.log("Loading user dashboard data for user:", user.uid);
      
      // Load dashboard data, notifications, and subscription
      const [dashboardData, notifications] = await Promise.all([
        getUserDashboardData(user.uid),
        getNotifications(user.uid)
      ]);
      
      // Load subscription data separately to avoid blocking
      loadUserSubscription();
      
      console.log("Raw dashboard data received:", dashboardData);
      
      const savedScholarshipsCount = Array.isArray(dashboardData.savedScholarships) ? dashboardData.savedScholarships.length : 0;
      const savedProgramsCount = Array.isArray(dashboardData.savedPrograms) ? dashboardData.savedPrograms.length : 0;
      const totalSavedOpportunities = savedScholarshipsCount + savedProgramsCount;
      
      const processedData = {
        totalScholarships: dashboardData.totalScholarships || 0,
        savedOpportunities: totalSavedOpportunities,
        savedScholarships: Array.isArray(dashboardData.savedScholarships) ? dashboardData.savedScholarships : [],
        completedApplications: Array.isArray(dashboardData.completedApplications) ? dashboardData.completedApplications : [],
        savedPrograms: Array.isArray(dashboardData.savedPrograms) ? dashboardData.savedPrograms : [],
        profileCompleted: Boolean(dashboardData.profileCompleted),
        quizProgress: {
          totalQuizzes: dashboardData.quizProgress?.totalQuizzes || 0,
          completedQuizzes: dashboardData.quizProgress?.completedQuizzes || 0,
          averageScore: dashboardData.quizProgress?.averageScore || 0,
          totalQuestions: dashboardData.quizProgress?.totalQuestions || 0,
          correctAnswers: dashboardData.quizProgress?.correctAnswers || 0
        }
      };
      
      setUserDashboardData(processedData);
      
      const unreadCount = notifications.filter(n => !n.read).length;
      setNotificationCount(unreadCount);
      
    } catch (error) {
      console.error("Error loading user dashboard data:", error);
      setError(error.message);
    } finally {
      setRefreshing(false);
    }
  }, [user, loadUserSubscription]);

  // Load user data when component mounts or user changes
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const scholarships = await getActiveScholarships();
        console.log("Loaded scholarships:", scholarships.length);
        setActualScholarshipCount(scholarships.length);
        
        await loadUserData();
        
      } catch (error) {
        console.error("Error loading initial data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user, refreshTrigger, loadUserData]);

  // Check for refresh state from navigation and localStorage
  useEffect(() => {
    const shouldRefresh = location.state?.refresh || localStorage.getItem('quizCompleted') === 'true';
    
    if (shouldRefresh && user && !user.isAnonymous) {
      console.log("Refresh detected, triggering refresh...");
      setRefreshTrigger(prev => prev + 1);
      navigate(location.pathname, { replace: true, state: {} });
      localStorage.removeItem('quizCompleted');
    }
  }, [location.state, user, navigate]);

  // Sample data
  const scholarshipData = useMemo(() => {
    return {
      total: actualScholarshipCount || 24,
      saved: userDashboardData.savedOpportunities,
      completed: Array.isArray(userDashboardData.completedApplications) ? userDashboardData.completedApplications.length : 0,
      genderStats: [
        { label: "Female", value: 52, color: "bg-pink-500" },
        { label: "Male", value: 48, color: "bg-blue-500" }
      ],
      stateStats: [
        { label: "Lagos", value: 35, color: "bg-blue-500" },
        { label: "Oyo", value: 28, color: "bg-purple-500" },
        { label: "Kano", value: 25, color: "bg-yellow-500" },
        { label: "Ogun", value: 20, color: "bg-green-500" },
        { label: "Anambra", value: 20, color: "bg-red-500" }
      ]
    };
  }, [actualScholarshipCount, userDashboardData.savedOpportunities, userDashboardData.completedApplications]);

  const recentScholarships = [
    {
      id: 1,
      title: "Nigerian Government Scholarship",
      description: "Full scholarship for undergraduate studies in Nigerian universities",
      deadline: "2024-12-15",
      amount: "₦500,000",
      category: "Government",
      saved: false
    },
    {
      id: 2,
      title: "MTN Foundation Scholarship",
      description: "Merit-based scholarship for science and engineering students",
      deadline: "2024-11-30",
      amount: "₦200,000",
      category: "Private",
      saved: true
    },
    {
      id: 3,
      title: "Chevron Scholarship Program",
      description: "Scholarship for students in petroleum engineering and related fields",
      deadline: "2024-10-20",
      amount: "₦300,000",
      category: "Corporate",
      saved: false
    }
  ];

  const StatCard = ({ title, value, icon: Icon, bgColor = "bg-white", textColor = "text-gray-800", onClick }) => (
    <div 
      className={`${bgColor} ${textColor} p-6 rounded-xl shadow-sm border border-gray-200 transition-transform hover:scale-105 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-70 mb-2">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="p-3 bg-black bg-opacity-10 rounded-full">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  const ChartBar = ({ data, title }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded ${item.color}`}></div>
              <span className="text-sm font-medium text-gray-600">{item.label}</span>
            </div>
            <span className="text-sm font-bold text-gray-800">{item.value}%</span>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 w-16">{item.label}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${item.color}`}
                style={{ width: `${item.value}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Subscription Modal Component
  const SubscriptionModal = () => (
    <div className="fixed inset-0 z-[70] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-800">Upgrade Your Experience</h2>
            </div>
            <button
              onClick={() => setShowSubscriptionModal(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          {userSubscription?.isActive && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-700 font-medium">
                  Current Plan: {userSubscription.plan} - Expires {new Date(userSubscription.expiresAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6">
          {subscriptionError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-red-800 font-medium mb-1">Payment Error</h4>
                  <p className="text-red-700 text-sm">{subscriptionError}</p>
                  <div className="mt-3 text-xs text-red-600">
                    <p><strong>Troubleshooting tips:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Check your internet connection</li>
                      <li>Make sure your backend is running</li>
                      <li>Verify API endpoints are correctly configured</li>
                      <li>Check browser console for more details</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => setSubscriptionError(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Development Mode Warning */}
          {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                <span className="text-yellow-800 font-medium text-sm">Development Mode</span>
              </div>
              <p className="text-yellow-700 text-sm mt-2">
                Make sure your backend server is running on the expected port with the subscription endpoints configured.
              </p>
              <details className="mt-2 text-xs text-yellow-600">
                <summary className="cursor-pointer hover:text-yellow-800">View Required Endpoints</summary>
                <div className="mt-2 bg-yellow-100 p-2 rounded font-mono">
                  <div>POST /api/subscription/initialize</div>
                  <div>GET /api/subscription/verify/:reference</div>
                  <div>GET /api/subscription/status/:userId</div>
                </div>
              </details>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative border-2 rounded-xl p-6 transition-all hover:shadow-lg ${
                  plan.popular ? 'border-red-500 shadow-md' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                  <div className="flex items-center justify-center space-x-1">
                    <span className="text-3xl font-bold text-gray-800">{plan.currency}{plan.price.toLocaleString()}</span>
                    <span className="text-gray-500">/{plan.interval}</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={subscriptionLoading || (userSubscription?.isActive && userSubscription?.plan === plan.id)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    userSubscription?.isActive && userSubscription?.plan === plan.id
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : subscriptionLoading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : `${plan.color} text-white hover:opacity-90`
                  }`}
                >
                  {subscriptionLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : userSubscription?.isActive && userSubscription?.plan === plan.id ? (
                    'Current Plan'
                  ) : (
                    'Subscribe Now'
                  )}
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Payment Information</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Secure payment processing via Paystack</li>
              <li>• Support for all Nigerian banks and cards</li>
              <li>• Cancel anytime from your settings</li>
              <li>• 24/7 customer support available</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced ScholarshipCard with subscription awareness
  const ScholarshipCard = ({ scholarship }) => {
    const [actionLoading, setActionLoading] = useState(false);
    const daysLeft = Math.ceil((new Date(scholarship.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    const isSaved = userDashboardData.savedScholarships.some(s => s.id === scholarship.id);
    const isCompleted = userDashboardData.completedApplications.some(a => a.id === scholarship.id);
    const isPremiumFeature = scholarship.category === 'Premium' && !userSubscription?.isActive;
    
    const handleSaveToggle = async () => {
      if (!user || user.isAnonymous || actionLoading) return;
      
      if (isPremiumFeature) {
        setShowSubscriptionModal(true);
        return;
      }
      
      try {
        setActionLoading(true);
        
        let result;
        if (isSaved) {
          result = await unsaveScholarship(user.uid, scholarship.id);
        } else {
          result = await saveScholarship(user.uid, scholarship);
        }
        
        await loadUserData();
        
      } catch (error) {
        console.error("Error toggling save:", error);
        setError(`Failed to ${isSaved ? 'unsave' : 'save'} scholarship: ${error.message}`);
      } finally {
        setActionLoading(false);
      }
    };

    const handleApply = async () => {
      if (!user || user.isAnonymous || actionLoading || isCompleted) return;
      
      if (isPremiumFeature) {
        setShowSubscriptionModal(true);
        return;
      }
      
      try {
        setActionLoading(true);
        
        const result = await completeApplication(user.uid, scholarship);
        await loadUserData();
        
      } catch (error) {
        console.error("Error completing application:", error);
        setError(`Failed to complete application: ${error.message}`);
      } finally {
        setActionLoading(false);
      }
    };
    
    return (
      <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative ${
        isPremiumFeature ? 'opacity-75' : ''
      }`}>
        {isPremiumFeature && (
          <div className="absolute top-4 right-4">
            <Crown className="w-5 h-5 text-yellow-500" />
          </div>
        )}
        
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{scholarship.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{scholarship.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{daysLeft > 0 ? `${daysLeft} days left` : "Expired"}</span>
              </div>
              <span className="font-semibold text-green-600">{scholarship.amount}</span>
            </div>
          </div>
          {!user?.isAnonymous && (
            <button 
              onClick={handleSaveToggle}
              disabled={actionLoading}
              className={`p-2 rounded-full transition-colors ${
                actionLoading ? 'opacity-50 cursor-not-allowed' : ''
              } ${isSaved ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''} ${actionLoading ? 'animate-pulse' : ''}`} />
            </button>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            scholarship.category === 'Government' ? 'bg-blue-100 text-blue-800' :
            scholarship.category === 'Private' ? 'bg-purple-100 text-purple-800' :
            scholarship.category === 'Premium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-orange-100 text-orange-800'
          }`}>
            {scholarship.category}
          </span>
          <button 
            onClick={handleApply}
            disabled={isCompleted || actionLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isCompleted 
                ? 'bg-green-500 text-white cursor-not-allowed' 
                : actionLoading
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : isPremiumFeature
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {actionLoading ? 'Processing...' : 
             isCompleted ? 'Applied' : 
             isPremiumFeature ? 'Upgrade to Apply' : 
             'Apply Now'}
          </button>
        </div>
      </div>
    );
  };

  const handleManualRefresh = useCallback(async () => {
    console.log("Manual refresh triggered");
    await loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    console.log("User dashboard data updated:", userDashboardData);
  }, [userDashboardData]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Error Banner */}
      {error && (
        <div className="fixed top-0 left-0 right-0 z-[70] bg-red-500 text-white p-3 text-center">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-white hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-slate-800 text-white z-50 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <BookOpen className="w-8 h-8 text-red-500" />
              <h1 className="text-xl font-bold">AccessEdu NG</h1>
            </button>
          </div>
          
          {/* Subscription Status Banner */}
          {!user?.isAnonymous && (
            <div className={`mb-6 p-4 rounded-lg ${
              userSubscription?.isActive 
                ? 'bg-green-800 border border-green-600' 
                : 'bg-gradient-to-r from-yellow-600 to-orange-600 border border-yellow-500'
            }`}>
              <div className="flex items-center space-x-2">
                {userSubscription?.isActive ? (
                  <>
                    <Crown className="w-5 h-5 text-yellow-300" />
                    <span className="text-sm font-medium text-white">Premium Active</span>
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5 text-yellow-300" />
                    <span className="text-sm font-medium text-white">Free Plan</span>
                  </>
                )}
              </div>
              {!userSubscription?.isActive && (
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="mt-2 w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-xs py-2 px-3 rounded-md transition-colors"
                >
                  Upgrade Now
                </button>
              )}
            </div>
          )}
          
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleSidebarNavigation(item.key)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors w-full text-left relative ${
                  item.active ? 'bg-red-500 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.premium && (
                  <Crown className="w-4 h-4 text-yellow-400 ml-auto" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={async () => {
              await signOut();
              navigate("/", { replace: true });
            }}
            className="flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>{user?.isAnonymous ? "Exit Guest Mode" : "Logout"}</span>
          </button>
          
          <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-400">
            <div className="flex space-x-4">
              <Link to="/about" className="hover:text-white">About</Link>
              <Link to="/sdg4" className="hover:text-white">SDG4</Link>
              <Link to="/credits" className="hover:text-white">Credits</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className={`bg-white shadow-sm border-b border-gray-200 px-6 py-4 ${error ? 'mt-12' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <BookOpen className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-800">AccessEdu NG</h2>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search scholarships..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 w-80"
                />
              </div>

              {/* Subscription Button in Header */}
              {!user?.isAnonymous && !userSubscription?.isActive && (
                <button
                  onClick={() => setShowSubscriptionModal(true)}
                  className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105"
                >
                  <Crown className="w-4 h-4" />
                  <span className="font-medium">Upgrade</span>
                </button>
              )}

              <LanguageSelector />

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button 
                onClick={handleManualRefresh}
                disabled={refreshing}
                className={`p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 ${
                  refreshing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="Refresh dashboard data"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button 
                onClick={() => navigate('/notifications')}
                className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                title="View Notifications"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              <button 
                onClick={() => navigate('/settings')}
                className="flex items-center space-x-3 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                title="Go to Settings"
              >
                {user?.isAnonymous && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Guest Mode
                  </span>
                )}
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold relative">
                  {user?.isAnonymous ? "G" : user?.email?.charAt(0).toUpperCase() || "U"}
                  {userSubscription?.isActive && (
                    <Crown className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Language modal opened from sidebar */}
        {showLanguageSelector && (
          <div
            className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
            onClick={() => setShowLanguageSelector(false)}
          >
            <div
              className="bg-white rounded-xl shadow-xl p-4 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-gray-700" />
                  <span className="font-semibold text-gray-800">Choose language</span>
                </div>
                <button
                  className="p-2 rounded-lg hover:bg-gray-100"
                  onClick={() => setShowLanguageSelector(false)}
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>
              <LanguageSelector className="w-full" />
            </div>
          </div>
        )}

        {/* Subscription Modal */}
        {showSubscriptionModal && <SubscriptionModal />}

        {/* Dashboard Content */}
        <main className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
          ) : (
            <>
              {/* Welcome Banner with Subscription CTA */}
              {!user?.isAnonymous && !userSubscription?.isActive && (
                <div className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 rounded-xl p-6 mb-8 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Zap className="w-6 h-6 text-yellow-300" />
                        <h3 className="text-xl font-bold">Unlock Premium Features</h3>
                      </div>
                      <p className="text-red-100 mb-4">
                        Get access to exclusive scholarships, priority notifications, and personalized recommendations.
                      </p>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-300" />
                          <span>500+ Premium Scholarships</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-300" />
                          <span>AI-Powered Matching</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-300" />
                          <span>Priority Support</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-6">
                      <button
                        onClick={() => setShowSubscriptionModal(true)}
                        className="bg-white text-red-500 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
                      >
                        <Crown className="w-5 h-5" />
                        <span>Upgrade Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Premium User Welcome */}
              {userSubscription?.isActive && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 mb-8 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Crown className="w-6 h-6 text-yellow-300" />
                        <h3 className="text-xl font-bold">Welcome Back, Premium Member!</h3>
                      </div>
                      <p className="text-green-100 mb-2">
                        You have full access to all premium features and scholarships.
                      </p>
                      <p className="text-green-200 text-sm">
                        Plan expires: {new Date(userSubscription.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-6">
                      <button
                        onClick={() => setShowSubscriptionModal(true)}
                        className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors"
                      >
                        Manage Plan
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title={t("Total Scholarships")}
                  value={scholarshipData.total}
                  icon={Users}
                  bgColor="bg-red-500"
                  textColor="text-white"
                  onClick={() => navigate('/scholarships')}
                />
                <StatCard
                  title={t("Saved Opportunities")}
                  value={scholarshipData.saved}
                  icon={Bookmark}
                />
                <StatCard
                  title={t("Completed Applications")}
                  value={scholarshipData.completed}
                  icon={CheckCircle}
                />
                <StatCard
                  title="Quiz Score"
                  value={`${userDashboardData.quizProgress.averageScore}%`}
                  icon={HelpCircle}
                  bgColor="bg-purple-500"
                  textColor="text-white"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <ChartBar data={scholarshipData.genderStats} title={t("Scholarships by Gender")} />
                <ChartBar data={scholarshipData.stateStats} title={t("Scholarships by State")} />
              </div>

              {/* Progress Bars */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("Saved Opportunities")}</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {userDashboardData.savedOpportunities}/{scholarshipData.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((userDashboardData.savedOpportunities / Math.max(scholarshipData.total, 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("Completed Applications")}</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {Array.isArray(userDashboardData.completedApplications) ? userDashboardData.completedApplications.length : 0}/{scholarshipData.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(((Array.isArray(userDashboardData.completedApplications) ? userDashboardData.completedApplications.length : 0) / Math.max(scholarshipData.total, 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Saved TVET Programs</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Programs Saved</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {Array.isArray(userDashboardData.savedPrograms) ? userDashboardData.savedPrograms.length : 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((Array.isArray(userDashboardData.savedPrograms) ? userDashboardData.savedPrograms.length : 0) * 10, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {Array.isArray(userDashboardData.savedPrograms) && userDashboardData.savedPrograms.length === 0 
                      ? 'No TVET programs saved yet' 
                      : `${userDashboardData.savedPrograms.length} program${userDashboardData.savedPrograms.length === 1 ? '' : 's'} saved`
                    }
                  </p>
                </div>
                
                {!user?.isAnonymous && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Completion</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {userDashboardData.profileCompleted ? '100%' : '0%'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${userDashboardData.profileCompleted ? 100 : 0}%` }}
                      ></div>
                    </div>
                    {!userDashboardData.profileCompleted && (
                      <p className="text-xs text-gray-500 mt-2">Complete your profile to unlock more features</p>
                    )}
                  </div>
                )}
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t("Quiz Progress")}</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {userDashboardData.quizProgress.completedQuizzes}/{userDashboardData.quizProgress.totalQuizzes || 1}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((userDashboardData.quizProgress.completedQuizzes / Math.max(userDashboardData.quizProgress.totalQuizzes, 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    <p>Average Score: {userDashboardData.quizProgress.averageScore}%</p>
                    <p>Questions Answered: {userDashboardData.quizProgress.correctAnswers}/{userDashboardData.quizProgress.totalQuestions}</p>
                  </div>
                </div>

                {/* Subscription Status Card */}
                {!user?.isAnonymous && (
                  <div className={`p-6 rounded-xl shadow-sm border-2 ${
                    userSubscription?.isActive 
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                      : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Subscription Status</h3>
                      {userSubscription?.isActive ? (
                        <Crown className="w-6 h-6 text-yellow-500" />
                      ) : (
                        <Star className="w-6 h-6 text-yellow-500" />
                      )}
                    </div>
                    
                    {userSubscription?.isActive ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Current Plan</span>
                          <span className="text-sm font-semibold text-green-700 capitalize">{userSubscription.plan}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Next Billing</span>
                          <span className="text-sm font-semibold text-gray-800">
                            {new Date(userSubscription.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowSubscriptionModal(true)}
                          className="w-full mt-4 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                        >
                          Manage Subscription
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">Free Plan - Limited Access</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>• Access to 10 scholarships</p>
                          <p>• Basic notifications</p>
                          <p>• Standard support</p>
                        </div>
                        <button
                          onClick={() => setShowSubscriptionModal(true)}
                          className="w-full mt-4 bg-gradient-to-r from-red-500 to-pink-500 text-white py-2 px-4 rounded-lg hover:from-red-600 hover:to-pink-600 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                        >
                          <Crown className="w-4 h-4" />
                          <span>Upgrade to Premium</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Recent Scholarships */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">Recent Scholarships</h3>
                  <div className="flex items-center space-x-3">
                    {!user?.isAnonymous && !userSubscription?.isActive && (
                      <button
                        onClick={() => setShowSubscriptionModal(true)}
                        className="flex items-center space-x-2 bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                      >
                        <Crown className="w-4 h-4" />
                        <span>See All</span>
                      </button>
                    )}
                    <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Filter className="w-4 h-4" />
                      <span>Filter</span>
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {recentScholarships.map((scholarship) => (
                    <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
                  ))}
                </div>
              </div>

              {/* Quick Actions for Free Users */}
              {!user?.isAnonymous && !userSubscription?.isActive && (
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                      onClick={() => setShowSubscriptionModal(true)}
                      className="p-4 border-2 border-dashed border-yellow-300 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors group"
                    >
                      <div className="text-center">
                        <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <h4 className="font-semibold text-gray-800">Unlock Premium</h4>
                        <p className="text-sm text-gray-600">Access 500+ scholarships</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => navigate('/scholarships')}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="text-center">
                        <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <h4 className="font-semibold text-gray-800">Browse Scholarships</h4>
                        <p className="text-sm text-gray-600">Find opportunities</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => navigate('/quiz')}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group"
                    >
                      <div className="text-center">
                        <HelpCircle className="w-8 h-8 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <h4 className="font-semibold text-gray-800">Take Quiz</h4>
                        <p className="text-sm text-gray-600">Test your knowledge</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}