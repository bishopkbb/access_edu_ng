import { useState, useEffect, useMemo } from "react";
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
  const [userDashboardData, setUserDashboardData] = useState({
    totalScholarships: 0,
    savedOpportunities: 0,
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
  });
  const [actualScholarshipCount, setActualScholarshipCount] = useState(0);

  // Load user data when component mounts or user changes
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const scholarships = await getActiveScholarships();
        console.log("Loaded scholarships:", scholarships.length);
        setActualScholarshipCount(scholarships.length);
        
        if (user && !user.isAnonymous) {
          const dashboardData = await getUserDashboardData(user.uid);
          setUserDashboardData(dashboardData);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, refreshTrigger]);

  // Check for refresh state from navigation and localStorage
  useEffect(() => {
    const shouldRefresh = location.state?.refresh || localStorage.getItem('quizCompleted') === 'true';
    
    if (shouldRefresh && user && !user.isAnonymous) {
      console.log("Refresh detected, triggering refresh...");
      setRefreshTrigger(prev => prev + 1);
      navigate(location.pathname, { replace: true, state: {} });
      localStorage.removeItem('quizCompleted');
    }
  }, [location.state, user]);

  const loadUserData = async () => {
    if (user && !user.isAnonymous) {
      try {
        setRefreshing(true);
        const dashboardData = await getUserDashboardData(user.uid);
        setUserDashboardData(dashboardData);
        console.log("Dashboard data refreshed:", dashboardData);
        console.log("Quiz progress data:", dashboardData.quizProgress);
      } catch (error) {
        console.error("Error refreshing user data:", error);
      } finally {
        setRefreshing(false);
      }
    }
  };

  // Sample data (static - shared across all users)
  const scholarshipData = useMemo(() => {
    console.log("Scholarship data memo - actualScholarshipCount:", actualScholarshipCount);
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

  const sidebarItems = [
    { icon: Home, label: t("Home"), active: true },
    { icon: BookOpen, label: t("Scholarships"), active: false },
    { icon: GraduationCap, label: t("TVET"), active: false },
    { icon: MessageSquare, label: t("Community Forum"), active: false },
    { icon: HelpCircle, label: t("Quizzes"), active: false },
    { icon: Globe, label: t("Language"), active: false },
    { icon: Settings, label: t("Settings"), active: false },
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

  const ScholarshipCard = ({ scholarship }) => {
    const daysLeft = Math.ceil((new Date(scholarship.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    const isSaved = userDashboardData.savedScholarships.some(s => s.id === scholarship.id);
    const isCompleted = userDashboardData.completedApplications.some(a => a.id === scholarship.id);
    
    const handleSaveToggle = async () => {
      if (!user || user.isAnonymous) return;
      
      try {
        if (isSaved) {
          await unsaveScholarship(user.uid, scholarship.id);
        } else {
          await saveScholarship(user.uid, scholarship);
        }
        const updatedData = await getUserDashboardData(user.uid);
        setUserDashboardData(updatedData);
      } catch (error) {
        console.error("Error toggling save:", error);
      }
    };

    const handleApply = async () => {
      if (!user || user.isAnonymous) return;
      try {
        await completeApplication(user.uid, scholarship);
        const updatedData = await getUserDashboardData(user.uid);
        setUserDashboardData(updatedData);
      } catch (error) {
        console.error("Error completing application:", error);
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
              className={`p-2 rounded-full transition-colors ${isSaved ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
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
            disabled={isCompleted}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isCompleted 
                ? 'bg-green-500 text-white cursor-not-allowed' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {isCompleted ? 'Applied' : 'Apply Now'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-slate-800 text-white z-50 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <BookOpen className="w-8 h-8 text-red-500" />
            <h1 className="text-xl font-bold">AccessEdu NG</h1>
          </div>
          
          <nav className="space-y-2">
            {sidebarItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  if (item.label === "Quizzes") {
                    navigate("/quiz");
                  } else if (item.label === "Scholarships") {
                    navigate("/scholarships");
                  } else if (item.label === "TVET") {
                    navigate("/tvet");
                  } else if (item.label === "Community Forum") {
                    navigate("/forum");
                  } else if (item.label === "Language") {
                    setShowLanguageSelector(true); // ✅ open language modal
                  } else if (item.label === "Settings") {
                    navigate("/settings");
                  }
                }}
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
          
          {/* ✅ Footer links now navigate */}
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
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
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
                onClick={loadUserData}
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
                onClick={() => navigate('/settings')}
                className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                title="Go to Settings"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
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
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.min((userDashboardData.savedOpportunities / scholarshipData.total) * 100, 100)}%` }}
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
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${Math.min(((Array.isArray(userDashboardData.completedApplications) ? userDashboardData.completedApplications.length : 0) / scholarshipData.total) * 100, 100)}%` }}
                    ></div>
                  </div>
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
                        className="bg-purple-500 h-2 rounded-full" 
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
                      className="bg-purple-500 h-2 rounded-full" 
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
