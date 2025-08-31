import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  saveScholarship, 
  unsaveScholarship, 
  completeApplication,
  getUserDashboardData 
} from "../services/userDataService";
import {
  getActiveScholarships,
  getUpcomingAnnouncements,
  subscribeToScholarships,
  subscribeToAnnouncements
} from "../services/scholarshipService";
import ApplicationFlow from "../components/scholarship/ApplicationFlow";
import {
  ArrowLeft,
  Search,
  Bookmark,
  Clock,
  Calendar,
  MapPin,
  GraduationCap,
  DollarSign,
  Users,
  Bell,
  TrendingUp,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  AlertCircle,
  Info
} from "lucide-react";

export default function Scholarships() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scholarships, setScholarships] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    category: "all",
    level: "all",
    state: "all",
    amount: "all"
  });
  const [userDashboardData, setUserDashboardData] = useState({
    savedScholarships: [],
    completedApplications: []
  });
  
  // Action loading states
  const [actionLoadingStates, setActionLoadingStates] = useState({});
  
  // Notification system
  const [notifications, setNotifications] = useState([]);

  // Application flow state
  const [showApplicationFlow, setShowApplicationFlow] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState(null);

  // Load user data for saved/completed scholarships
  useEffect(() => {
    if (user && !user.isAnonymous) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const data = await getUserDashboardData(user.uid);
      setUserDashboardData(data);
    } catch (error) {
      console.error("Error loading user data:", error);
      showNotification("Failed to load user data. Please refresh the page.", "error");
    }
  };

  // Load scholarships and announcements
  useEffect(() => {
    loadScholarships();
    loadAnnouncements();
    
    // Set up real-time listeners for live updates
    const unsubscribeScholarships = subscribeToScholarships((updatedScholarships) => {
      setScholarships(updatedScholarships);
    });
    
    const unsubscribeAnnouncements = subscribeToAnnouncements((updatedAnnouncements) => {
      setAnnouncements(updatedAnnouncements);
    });
    
    // Cleanup listeners on unmount
    return () => {
      if (typeof unsubscribeScholarships === 'function') {
        unsubscribeScholarships();
      }
      if (typeof unsubscribeAnnouncements === 'function') {
        unsubscribeAnnouncements();
      }
    };
  }, []);

  const loadScholarships = async () => {
    setLoading(true);
    try {
      const scholarshipsData = await getActiveScholarships();
      setScholarships(Array.isArray(scholarshipsData) ? scholarshipsData : []);
    } catch (error) {
      console.error("Error loading scholarships:", error);
      showNotification("Failed to load scholarships. Please refresh the page.", "error");
      setScholarships([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const announcementsData = await getUpcomingAnnouncements();
      setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
    } catch (error) {
      console.error("Error loading announcements:", error);
      // Don't show error for announcements as they're not critical
    }
  };

  // Notification system
  const showNotification = (message, type = "success") => {
    const id = Date.now() + Math.random();
    const newNotification = { id, message, type, timestamp: Date.now() };
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Set loading state for specific actions
  const setActionLoading = (actionKey, isLoading) => {
    setActionLoadingStates(prev => ({
      ...prev,
      [actionKey]: isLoading
    }));
  };

  // Filter and search scholarships
  const filteredScholarships = useMemo(() => {
    if (!Array.isArray(scholarships)) return [];
    
    return scholarships.filter(scholarship => {
      // Ensure scholarship has required fields
      if (!scholarship || !scholarship.title || !scholarship.deadline) return false;

      // Search filter
      const searchFields = [
        scholarship.title || '',
        scholarship.description || '',
        scholarship.institution || ''
      ].join(' ').toLowerCase();
      const matchesSearch = searchFields.includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = selectedFilters.category === "all" || 
                             scholarship.category === selectedFilters.category;

      // Level filter
      const matchesLevel = selectedFilters.level === "all" || 
                          scholarship.level === selectedFilters.level;

      // State filter
      const matchesState = selectedFilters.state === "all" || 
                          scholarship.state === selectedFilters.state;

      // Amount filter
      const amount = Number(scholarship.amount) || 0;
      const matchesAmount = selectedFilters.amount === "all" || 
        (selectedFilters.amount === "low" && amount < 100000) ||
        (selectedFilters.amount === "medium" && amount >= 100000 && amount < 500000) ||
        (selectedFilters.amount === "high" && amount >= 500000);

      return matchesSearch && matchesCategory && matchesLevel && matchesState && matchesAmount;
    });
  }, [scholarships, searchQuery, selectedFilters]);

  // Handle scholarship save/unsave
  const handleSaveToggle = async (scholarship) => {
    if (!user || user.isAnonymous) {
      showNotification("Please log in to save scholarships", "error");
      navigate("/login");
      return;
    }
    
    // Get scholarship ID using the same logic as handleApply
    const scholarshipId = scholarship?.id || scholarship?.scholarshipId || scholarship?._id || scholarship?.key;
    
    if (!scholarshipId) {
      console.error("Cannot save scholarship - ID missing:", scholarship);
      showNotification("Unable to save scholarship - missing ID", "error");
      return;
    }
    
    const actionKey = `save-${scholarshipId}`;
    if (actionLoadingStates[actionKey]) return; // Prevent double-clicks
    
    setActionLoading(actionKey, true);
    
    try {
      const isSaved = userDashboardData.savedScholarships.some(s => 
        (s.id || s.scholarshipId || s._id || s.key) === scholarshipId
      );
      
      if (isSaved) {
        await unsaveScholarship(user.uid, scholarshipId);
        showNotification("Scholarship removed from saved list", "success");
      } else {
        // Ensure the scholarship object has an ID when saving
        const scholarshipToSave = { ...scholarship, id: scholarshipId };
        await saveScholarship(user.uid, scholarshipToSave);
        showNotification("Scholarship saved successfully", "success");
      }
      
      // Refresh user data to get updated state
      await loadUserData();
    } catch (error) {
      console.error("Error toggling save:", error);
      const action = userDashboardData.savedScholarships.some(s => 
        (s.id || s.scholarshipId || s._id || s.key) === scholarshipId
      ) ? 'removing' : 'saving';
      showNotification(`Failed ${action} scholarship. Please try again.`, "error");
    } finally {
      setActionLoading(actionKey, false);
    }
  };

  // Handle scholarship application
  const handleApply = async (scholarship) => {
    // Debug: Log the scholarship object
    console.log("Apply button clicked for scholarship:", scholarship);
    
    // Validate scholarship object with detailed logging
    if (!scholarship) {
      console.error("Scholarship object is null or undefined");
      showNotification("Scholarship data is missing", "error");
      return;
    }
    
    // Check for ID - try multiple possible ID field names
    const scholarshipId = scholarship.id || scholarship.scholarshipId || scholarship._id || scholarship.key;
    
    if (!scholarshipId) {
      console.error("Scholarship ID is missing. Available fields:", Object.keys(scholarship));
      showNotification("Scholarship ID is missing. Please contact support.", "error");
      return;
    }
    
    // Check if user is authenticated
    if (!user || user.isAnonymous) {
      showNotification("Please log in to apply for scholarships", "error");
      navigate("/login");
      return;
    }

    // Check if already applied - use the found ID
    const isCompleted = userDashboardData.completedApplications.some(a => a.id === scholarshipId);
    if (isCompleted) {
      showNotification("You have already applied for this scholarship", "info");
      return;
    }

    // Check if scholarship is expired
    const daysLeft = getDaysLeft(scholarship.deadline);
    if (daysLeft <= 0) {
      showNotification("This scholarship application deadline has passed", "error");
      return;
    }
    
    // Open application flow
    setSelectedScholarship(scholarship);
    setShowApplicationFlow(true);
  };

  // Handle application flow close
  const handleApplicationClose = () => {
    setShowApplicationFlow(false);
    setSelectedScholarship(null);
  };

  // Handle application success
  const handleApplicationSuccess = async (result) => {
    showNotification("Application submitted successfully! Check your email for confirmation.", "success");
    await loadUserData(); // Refresh user data
    handleApplicationClose();
  };

  // Calculate days left until deadline
  const getDaysLeft = (deadline) => {
    if (!deadline) return 0;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff > 0 ? daysDiff : 0;
  };

  // Get status badge for scholarship
  const getStatusBadge = (scholarship) => {
    const daysLeft = getDaysLeft(scholarship.deadline);
    
    if (daysLeft === 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
          <XCircle className="w-3 h-3 mr-1" />
          Expired
        </span>
      );
    } else if (daysLeft <= 7) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">
          <AlertCircle className="w-3 h-3 mr-1" />
          Urgent
        </span>
      );
    } else if (daysLeft <= 30) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
          <Clock className="w-3 h-3 mr-1" />
          Soon
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
          <CheckCircle className="w-3 h-3 mr-1" />
          Open
        </span>
      );
    }
  };

  // Scholarship Card Component
  const ScholarshipCard = ({ scholarship }) => {
    // Handle missing scholarship object
    if (!scholarship) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center text-gray-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Scholarship data unavailable</p>
          </div>
        </div>
      );
    }

    // Get scholarship ID using flexible approach
    const scholarshipId = scholarship.id || scholarship.scholarshipId || scholarship._id || scholarship.key;
    
    const daysLeft = getDaysLeft(scholarship.deadline);
    const isSaved = userDashboardData.savedScholarships.some(s => 
      (s.id || s.scholarshipId || s._id || s.key) === scholarshipId
    );
    const isCompleted = userDashboardData.completedApplications.some(a => 
      (a.id || a.scholarshipId || a._id || a.key) === scholarshipId
    );
    const isExpired = daysLeft <= 0;
    const isApplyLoading = scholarshipId && actionLoadingStates[`apply-${scholarshipId}`];
    const isSaveLoading = scholarshipId && actionLoadingStates[`save-${scholarshipId}`];

    // Determine button state and styling
    const getApplyButtonConfig = () => {
      if (isCompleted) {
        return {
          text: 'Applied',
          icon: <CheckCircle className="w-4 h-4" />,
          className: 'bg-green-500 text-white cursor-not-allowed',
          disabled: true
        };
      }
      
      if (isExpired) {
        return {
          text: 'Expired',
          icon: <XCircle className="w-4 h-4" />,
          className: 'bg-gray-300 text-gray-500 cursor-not-allowed',
          disabled: true
        };
      }
      
      if (isApplyLoading) {
        return {
          text: 'Applying...',
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          className: 'bg-red-400 text-white cursor-not-allowed',
          disabled: true
        };
      }
      
      return {
        text: 'Apply Now',
        icon: null,
        className: 'bg-red-500 text-white hover:bg-red-600 focus:ring-4 focus:ring-red-200',
        disabled: false
      };
    };

    const buttonConfig = getApplyButtonConfig();

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 pr-4">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusBadge(scholarship)}
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  scholarship.category === 'Government' ? 'bg-blue-100 text-blue-800' :
                  scholarship.category === 'Private' ? 'bg-purple-100 text-purple-800' :
                  scholarship.category === 'Corporate' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {scholarship.category || 'Other'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                {scholarship.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                {scholarship.description}
              </p>
            </div>
            
            {/* Save Button */}
            {user && !user.isAnonymous && (
              <button 
                onClick={() => handleSaveToggle(scholarship)}
                disabled={isSaveLoading}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isSaved ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                } ${isSaveLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isSaved ? 'Remove from saved' : 'Save scholarship'}
              >
                {isSaveLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                )}
              </button>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <GraduationCap className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{scholarship.level || 'Not specified'}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{scholarship.state || 'Not specified'}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <DollarSign className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                ₦{(scholarship.amount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{scholarship.slots || 'Limited'} slots</span>
            </div>
          </div>

          {/* Deadline Information */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 font-medium">
                {isExpired ? "Expired" : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {scholarship.deadline ? new Date(scholarship.deadline).toLocaleDateString('en-NG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : 'No deadline specified'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {/* Apply Now Button */}
            <button 
              onClick={(e) => {
                e.preventDefault();
                console.log("Button clicked, scholarship object:", scholarship);
                handleApply(scholarship);
              }}
              disabled={buttonConfig.disabled}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${buttonConfig.className}`}
              aria-label={`Apply for ${scholarship?.title || 'scholarship'}`}
            >
              {buttonConfig.icon}
              <span>{buttonConfig.text}</span>
            </button>
            
            {/* External Link Button */}
            {scholarship.website && (
              <button 
                className="px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center justify-center"
                onClick={() => {
                  try {
                    window.open(scholarship.website, '_blank', 'noopener,noreferrer');
                  } catch (error) {
                    console.error('Error opening website:', error);
                    showNotification("Unable to open website", "error");
                  }
                }}
                title="Visit scholarship website"
                aria-label={`Visit ${scholarship.title} website`}
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Login Prompt for Anonymous Users */}
          {(!user || user.isAnonymous) && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  <button 
                    onClick={() => navigate("/login")}
                    className="font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                  >
                    Log in
                  </button> to apply for scholarships and save your favorites
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Announcement Card Component
  const AnnouncementCard = ({ announcement }) => {
    if (!announcement.expectedStart) return null;
    
    const daysUntilStart = Math.ceil((new Date(announcement.expectedStart) - new Date()) / (1000 * 60 * 60 * 24));
    
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 hover:shadow-sm transition-shadow duration-200">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-500 rounded-full flex-shrink-0">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-800 mb-1 line-clamp-2">
              {announcement.title}
            </h4>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {announcement.description}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>Expected: {new Date(announcement.expectedStart).toLocaleDateString('en-NG')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{daysUntilStart > 0 ? `${daysUntilStart} days away` : 'Starting soon'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Notification Component
  const NotificationToast = ({ notification }) => (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm border-l-4 ${
      notification.type === 'success' ? 'bg-white border-green-500 text-gray-800' :
      notification.type === 'error' ? 'bg-white border-red-500 text-gray-800' :
      notification.type === 'info' ? 'bg-white border-blue-500 text-gray-800' :
      'bg-white border-gray-500 text-gray-800'
    } animate-slide-in`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />}
          {notification.type === 'error' && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
          {notification.type === 'info' && <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
        <button 
          onClick={() => removeNotification(notification.id)} 
          className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 rounded"
          aria-label="Close notification"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Application Flow Modal */}
      {showApplicationFlow && selectedScholarship && (
        <ApplicationFlow
          scholarship={selectedScholarship}
          onClose={handleApplicationClose}
          onSuccess={handleApplicationSuccess}
        />
      )}

      {/* Notification Toasts */}
      {notifications.map(notification => (
        <NotificationToast key={notification.id} notification={notification} />
      ))}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                aria-label="Go back to dashboard"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Scholarships</h1>
                <p className="text-gray-600">Find and apply for Nigerian scholarships</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {loading ? 'Loading...' : `${filteredScholarships.length} scholarship${filteredScholarships.length !== 1 ? 's' : ''} available`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Announcements Section */}
        {announcements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Upcoming Scholarships</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search scholarships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                aria-label="Search scholarships"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <select
                value={selectedFilters.category}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                aria-label="Filter by category"
              >
                <option value="all">All Categories</option>
                <option value="Government">Government</option>
                <option value="Private">Private</option>
                <option value="Corporate">Corporate</option>
              </select>

              <select
                value={selectedFilters.level}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, level: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                aria-label="Filter by education level"
              >
                <option value="all">All Levels</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="PhD">PhD</option>
              </select>

              <select
                value={selectedFilters.state}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, state: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                aria-label="Filter by state"
              >
                <option value="all">All States</option>
                <option value="Lagos">Lagos</option>
                <option value="FCT">FCT</option>
                <option value="Rivers">Rivers</option>
                <option value="Kano">Kano</option>
                <option value="Kaduna">Kaduna</option>
              </select>

              <select
                value={selectedFilters.amount}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, amount: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                aria-label="Filter by amount"
              >
                <option value="all">All Amounts</option>
                <option value="low">Under ₦100k</option>
                <option value="medium">₦100k - ₦500k</option>
                <option value="high">Over ₦500k</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {!loading && scholarships.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load scholarships</h3>
              <p className="text-gray-500 mb-4">There was an error loading scholarship data.</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading scholarships...</p>
            </div>
          </div>
        )}

        {/* No Results State */}
        {!loading && scholarships.length > 0 && filteredScholarships.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scholarships found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search terms or filters</p>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedFilters({
                    category: "all",
                    level: "all",
                    state: "all",
                    amount: "all"
                  });
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Scholarships Grid */}
        {!loading && filteredScholarships.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScholarships.map((scholarship, index) => (
              <ScholarshipCard key={scholarship.id || `scholarship-${index}`} scholarship={scholarship} />
            ))}
          </div>
        )}

        {/* Quick Stats Footer */}
        {!loading && scholarships.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-500">
                  {scholarships.length}
                </div>
                <div className="text-sm text-gray-600">Total Scholarships</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">
                  {scholarships.filter(s => getDaysLeft(s.deadline) > 30).length}
                </div>
                <div className="text-sm text-gray-600">Open Applications</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">
                  {scholarships.filter(s => {
                    const days = getDaysLeft(s.deadline);
                    return days > 0 && days <= 30;
                  }).length}
                </div>
                <div className="text-sm text-gray-600">Closing Soon</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">
                  ₦{scholarships.reduce((total, s) => total + (s.amount || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Styles for Animations */}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}