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
import {
  ArrowLeft,
  Search,
  Filter,
  Bookmark,
  Clock,
  Calendar,
  MapPin,
  GraduationCap,
  DollarSign,
  Users,
  Bell,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  Eye,
  ExternalLink
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
      unsubscribeScholarships();
      unsubscribeAnnouncements();
    };
  }, []);

  const loadScholarships = async () => {
    setLoading(true);
    try {
      const scholarshipsData = await getActiveScholarships();
      setScholarships(scholarshipsData);
    } catch (error) {
      console.error("Error loading scholarships:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const announcementsData = await getUpcomingAnnouncements();
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error("Error loading announcements:", error);
    }
  };

  // Filter and search scholarships
  const filteredScholarships = useMemo(() => {
    return scholarships.filter(scholarship => {
      // Search filter
      const matchesSearch = scholarship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           scholarship.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           scholarship.institution.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = selectedFilters.category === "all" || scholarship.category === selectedFilters.category;

      // Level filter
      const matchesLevel = selectedFilters.level === "all" || scholarship.level === selectedFilters.level;

      // State filter
      const matchesState = selectedFilters.state === "all" || scholarship.state === selectedFilters.state;

      // Amount filter
      const matchesAmount = selectedFilters.amount === "all" || 
        (selectedFilters.amount === "low" && scholarship.amount < 100000) ||
        (selectedFilters.amount === "medium" && scholarship.amount >= 100000 && scholarship.amount < 500000) ||
        (selectedFilters.amount === "high" && scholarship.amount >= 500000);

      return matchesSearch && matchesCategory && matchesLevel && matchesState && matchesAmount;
    });
  }, [scholarships, searchQuery, selectedFilters]);

  // Handle scholarship actions
  const handleSaveToggle = async (scholarship) => {
    if (!user || user.isAnonymous) return;
    
    try {
      const isSaved = userDashboardData.savedScholarships.some(s => s.id === scholarship.id);
      
      if (isSaved) {
        await unsaveScholarship(user.uid, scholarship.id);
      } else {
        await saveScholarship(user.uid, scholarship);
      }
      
      // Refresh user data
      await loadUserData();
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const handleApply = async (scholarship) => {
    if (!user || user.isAnonymous) return;
    
    try {
      await completeApplication(user.uid, scholarship);
      await loadUserData();
    } catch (error) {
      console.error("Error completing application:", error);
    }
  };

  // Calculate days left
  const getDaysLeft = (deadline) => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // Get status badge
  const getStatusBadge = (scholarship) => {
    const daysLeft = getDaysLeft(scholarship.deadline);
    
    if (daysLeft === 0) {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Expired</span>;
    } else if (daysLeft <= 7) {
      return <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">Urgent</span>;
    } else if (daysLeft <= 30) {
      return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Soon</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Open</span>;
    }
  };

  // Scholarship Card Component
  const ScholarshipCard = ({ scholarship }) => {
    const daysLeft = getDaysLeft(scholarship.deadline);
    const isSaved = userDashboardData.savedScholarships.some(s => s.id === scholarship.id);
    const isCompleted = userDashboardData.completedApplications.some(a => a.id === scholarship.id);
    const isExpired = daysLeft === 0;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {getStatusBadge(scholarship)}
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  scholarship.category === 'Government' ? 'bg-blue-100 text-blue-800' :
                  scholarship.category === 'Private' ? 'bg-purple-100 text-purple-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {scholarship.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{scholarship.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{scholarship.description}</p>
            </div>
            {!user?.isAnonymous && (
              <button 
                onClick={() => handleSaveToggle(scholarship)}
                className={`p-2 rounded-full transition-colors ${isSaved ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <GraduationCap className="w-4 h-4" />
              <span>{scholarship.level}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{scholarship.state}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <DollarSign className="w-4 h-4" />
              <span>₦{scholarship.amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{scholarship.slots} slots</span>
            </div>
          </div>

          {/* Deadline */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                {isExpired ? "Expired" : `${daysLeft} days left`}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Deadline: {new Date(scholarship.deadline).toLocaleDateString()}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button 
              onClick={() => handleApply(scholarship)}
              disabled={isCompleted || isExpired}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isCompleted 
                  ? 'bg-green-500 text-white cursor-not-allowed' 
                  : isExpired
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {isCompleted ? 'Applied' : isExpired ? 'Expired' : 'Apply Now'}
            </button>
            <button 
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => window.open(scholarship.website, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Announcement Card Component
  const AnnouncementCard = ({ announcement }) => {
    const daysUntilStart = Math.ceil((new Date(announcement.expectedStart) - new Date()) / (1000 * 60 * 60 * 24));
    
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-500 rounded-full">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 mb-1">{announcement.title}</h4>
            <p className="text-sm text-gray-600 mb-2">{announcement.description}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>Expected: {new Date(announcement.expectedStart).toLocaleDateString()}</span>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
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
                {filteredScholarships.length} scholarships available
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
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            {/* Filters */}
            <div className="flex space-x-4">
              <select
                value={selectedFilters.category}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Categories</option>
                <option value="Government">Government</option>
                <option value="Private">Private</option>
                <option value="Corporate">Corporate</option>
              </select>

              <select
                value={selectedFilters.level}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, level: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Levels</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="PhD">PhD</option>
              </select>

              <select
                value={selectedFilters.amount}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, amount: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Amounts</option>
                <option value="low">Under ₦100k</option>
                <option value="medium">₦100k - ₦500k</option>
                <option value="high">Over ₦500k</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scholarships Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : filteredScholarships.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scholarships found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScholarships.map((scholarship) => (
              <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
