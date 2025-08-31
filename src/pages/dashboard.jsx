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
  RefreshCw
} from "lucide-react";

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
  
  // ✅ Enhanced state with better error handling
  const [error, setError] = useState(null);
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

  // ✅ Create a stable navigation handler using useCallback
  const handleSidebarNavigation = useCallback((itemKey) => {
    console.log("Navigating to:", itemKey);
    
    switch(itemKey) {
      case "home":
        // Already on dashboard/home, do nothing or scroll to top
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
      default:
        console.warn("Unknown navigation key:", itemKey);
    }
    
    // Close sidebar on mobile after navigation
    setSidebarOpen(false);
  }, [navigate]);

  // ✅ Create sidebarItems with stable references using useMemo
  const sidebarItems = useMemo(() => [
    { icon: Home, label: t("Home"), active: true, key: "home" },
    { icon: BookOpen, label: t("Scholarships"), active: false, key: "scholarships" },
    { icon: GraduationCap, label: t("TVET"), active: false, key: "tvet" },
    { icon: MessageSquare, label: t("Community Forum"), active: false, key: "forum" },
    { icon: HelpCircle, label: t("Quizzes"), active: false, key: "quizzes" },
    { icon: Globe, label: t("Language"), active: false, key: "language" },
    { icon: Settings, label: t("Settings"), active: false, key: "settings" },
  ], [t]);

  // ✅ Enhanced data loading with better error handling and logging
  const loadUserData = useCallback(async () => {
    if (!user || user.isAnonymous) {
      console.log("User is anonymous or not logged in, skipping data load");
      return;
    }

    try {
      setRefreshing(true);
      setError(null);
      
      console.log("Loading user dashboard data for user:", user.uid);
      
      // Load dashboard data and notifications with detailed logging
      const [dashboardData, notifications] = await Promise.all([
        getUserDashboardData(user.uid),
        getNotifications(user.uid)
      ]);
      console.log("Raw dashboard data received:", dashboardData);
      console.log("Notifications received:", notifications);
      
      // Calculate total saved opportunities (scholarships + programs)
      const savedScholarshipsCount = Array.isArray(dashboardData.savedScholarships) ? dashboardData.savedScholarships.length : 0;
      const savedProgramsCount = Array.isArray(dashboardData.savedPrograms) ? dashboardData.savedPrograms.length : 0;
      const totalSavedOpportunities = savedScholarshipsCount + savedProgramsCount;
      
      // Ensure data structure is correct
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
      
      console.log("Processed dashboard data:", processedData);
      setUserDashboardData(processedData);
      
      // Set notification count
      const unreadCount = notifications.filter(n => !n.read).length;
      setNotificationCount(unreadCount);
      
    } catch (error) {
      console.error("Error loading user dashboard data:", error);
      setError(error.message);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  // Load user data when component mounts or user changes
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load scholarship count
        const scholarships = await getActiveScholarships();
        console.log("Loaded scholarships:", scholarships.length);
        setActualScholarshipCount(scholarships.length);
        
        // Load user-specific data if not anonymous
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

  // Sample data (static - shared across all users)
  const scholarshipData = useMemo(() => {
    console.log("Scholarship data memo - actualScholarshipCount:", actualScholarshipCount);
    console.log("Current user dashboard data:", userDashboardData);
    
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

  // ✅ Enhanced ScholarshipCard with better error handling and state management
  const ScholarshipCard = ({ scholarship }) => {
    const [actionLoading, setActionLoading] = useState(false);
    const daysLeft = Math.ceil((new Date(scholarship.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    const isSaved = userDashboardData.savedScholarships.some(s => s.id === scholarship.id);
    const isCompleted = userDashboardData.completedApplications.some(a => a.id === scholarship.id);
    
    const handleSaveToggle = async () => {
      if (!user || user.isAnonymous || actionLoading) return;
      
      try {
        setActionLoading(true);
        console.log(`${isSaved ? 'Unsaving' : 'Saving'} scholarship:`, scholarship.id);
        
        let result;
        if (isSaved) {
          result = await unsaveScholarship(user.uid, scholarship.id);
        } else {
          result = await saveScholarship(user.uid, scholarship);
        }
        
        console.log("Save/unsave result:", result);
        
        // ✅ Force refresh of dashboard data
        await loadUserData();
        
        console.log("Updated dashboard data after save/unsave");
        
      } catch (error) {
        console.error("Error toggling save:", error);
        setError(`Failed to ${isSaved ? 'unsave' : 'save'} scholarship: ${error.message}`);
      } finally {
        setActionLoading(false);
      }
    };

    const handleApply = async () => {
      if (!user || user.isAnonymous || actionLoading || isCompleted) return;
      
      try {
        setActionLoading(true);
        console.log("Applying to scholarship:", scholarship.id);
        
        const result = await completeApplication(user.uid, scholarship);
        console.log("Application result:", result);
        
        // ✅ Force refresh of dashboard data
        await loadUserData();
        
        console.log("Updated dashboard data after application");
        
      } catch (error) {
        console.error("Error completing application:", error);
        setError(`Failed to complete application: ${error.message}`);
      } finally {
        setActionLoading(false);
      }
    };
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
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
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {actionLoading ? 'Processing...' : isCompleted ? 'Applied' : 'Apply Now'}
          </button>
        </div>
      </div>
    );
  };

  // ✅ Enhanced manual refresh function
  const handleManualRefresh = useCallback(async () => {
    console.log("Manual refresh triggered");
    await loadUserData();
  }, [loadUserData]);

  // ✅ Debug effect to monitor user data changes
  useEffect(() => {
    console.log("User dashboard data updated:", userDashboardData);
  }, [userDashboardData]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* ✅ Error Banner */}
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
          
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.key} // ✅ Use stable key instead of index
                onClick={() => handleSidebarNavigation(item.key)} // ✅ Use stable handler with key
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors w-full text-left ${
                  item.active ? 'bg-red-500 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
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

              {/* Language Selector (existing in header left as-is) */}
              <LanguageSelector />

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Refresh Button */}
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

              {/* Notifications */}
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

              {/* Profile */}
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
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.isAnonymous ? "G" : user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* ✅ Language modal opened from sidebar "Language" */}
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

        {/* Dashboard Content */}
        <main className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
          ) : (
            <>


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
              </div>

              {/* Recent Scholarships */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">Recent Scholarships</h3>
                  <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {recentScholarships.map((scholarship) => (
                    <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}