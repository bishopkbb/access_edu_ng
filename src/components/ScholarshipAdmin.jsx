import { useState, useEffect } from "react";
import { 
  addScholarship, 
  updateScholarship, 
  deleteScholarship, 
  addAnnouncement,
  getActiveScholarships,
  getUpcomingAnnouncements 
} from "../services/scholarshipService";
import ScholarshipAutomationAdmin from "./ScholarshipAutomationAdmin";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  GraduationCap,
  Zap,
  Settings
} from "lucide-react";

export default function ScholarshipAdmin() {
  const [scholarships, setScholarships] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [editingScholarship, setEditingScholarship] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [showScholarshipForm, setShowScholarshipForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAutomation, setShowAutomation] = useState(false);

  const [scholarshipForm, setScholarshipForm] = useState({
    title: "",
    description: "",
    category: "Government",
    level: "Undergraduate",
    state: "All States",
    amount: "",
    slots: "",
    deadline: "",
    website: "",
    institution: ""
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    description: "",
    expectedStart: "",
    category: "Government"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [scholarshipsData, announcementsData] = await Promise.all([
        getActiveScholarships(),
        getUpcomingAnnouncements()
      ]);
      setScholarships(scholarshipsData);
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScholarshipSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingScholarship) {
        await updateScholarship(editingScholarship.id, scholarshipForm);
      } else {
        await addScholarship(scholarshipForm);
      }
      
      setShowScholarshipForm(false);
      setEditingScholarship(null);
      setScholarshipForm({
        title: "",
        description: "",
        category: "Government",
        level: "Undergraduate",
        state: "All States",
        amount: "",
        slots: "",
        deadline: "",
        website: "",
        institution: ""
      });
      
      await loadData();
    } catch (error) {
      console.error("Error saving scholarship:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await addAnnouncement(announcementForm);
      
      setShowAnnouncementForm(false);
      setAnnouncementForm({
        title: "",
        description: "",
        expectedStart: "",
        category: "Government"
      });
      
      await loadData();
    } catch (error) {
      console.error("Error saving announcement:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditScholarship = (scholarship) => {
    setEditingScholarship(scholarship);
    setScholarshipForm({
      title: scholarship.title,
      description: scholarship.description,
      category: scholarship.category,
      level: scholarship.level,
      state: scholarship.state,
      amount: scholarship.amount.toString(),
      slots: scholarship.slots.toString(),
      deadline: scholarship.deadline.split('T')[0],
      website: scholarship.website,
      institution: scholarship.institution
    });
    setShowScholarshipForm(true);
  };

  const handleDeleteScholarship = async (scholarshipId) => {
    if (window.confirm("Are you sure you want to delete this scholarship?")) {
      setLoading(true);
      try {
        await deleteScholarship(scholarshipId);
        await loadData();
      } catch (error) {
        console.error("Error deleting scholarship:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForms = () => {
    setShowScholarshipForm(false);
    setShowAnnouncementForm(false);
    setEditingScholarship(null);
    setScholarshipForm({
      title: "",
      description: "",
      category: "Government",
      level: "Undergraduate",
      state: "All States",
      amount: "",
      slots: "",
      deadline: "",
      website: "",
      institution: ""
    });
    setAnnouncementForm({
      title: "",
      description: "",
      expectedStart: "",
      category: "Government"
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Scholarship Management</h1>
        <p className="text-gray-600">Manage scholarships and announcements</p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setShowScholarshipForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Scholarship</span>
        </button>
        <button
          onClick={() => setShowAnnouncementForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Announcement</span>
        </button>
        <button
          onClick={() => setShowAutomation(!showAutomation)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Zap className="w-4 h-4" />
          <span>{showAutomation ? 'Hide' : 'Show'} Automation</span>
        </button>
      </div>

      {/* Scholarship Form Modal */}
      {showScholarshipForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {editingScholarship ? "Edit Scholarship" : "Add New Scholarship"}
              </h2>
              <button onClick={resetForms} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleScholarshipSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={scholarshipForm.title}
                    onChange={(e) => setScholarshipForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={scholarshipForm.category}
                    onChange={(e) => setScholarshipForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="Government">Government</option>
                    <option value="Private">Private</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    value={scholarshipForm.level}
                    onChange={(e) => setScholarshipForm(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={scholarshipForm.state}
                    onChange={(e) => setScholarshipForm(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="All States"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
                  <input
                    type="number"
                    required
                    value={scholarshipForm.amount}
                    onChange={(e) => setScholarshipForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Slots</label>
                  <input
                    type="number"
                    required
                    value={scholarshipForm.slots}
                    onChange={(e) => setScholarshipForm(prev => ({ ...prev, slots: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    required
                    value={scholarshipForm.deadline}
                    onChange={(e) => setScholarshipForm(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                  <input
                    type="text"
                    required
                    value={scholarshipForm.institution}
                    onChange={(e) => setScholarshipForm(prev => ({ ...prev, institution: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <input
                  type="url"
                  value={scholarshipForm.website}
                  onChange={(e) => setScholarshipForm(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  value={scholarshipForm.description}
                  onChange={(e) => setScholarshipForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {loading ? "Saving..." : (editingScholarship ? "Update" : "Add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Form Modal */}
      {showAnnouncementForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Add New Announcement</h2>
              <button onClick={resetForms} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={announcementForm.category}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="Government">Government</option>
                  <option value="Private">Private</option>
                  <option value="Corporate">Corporate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Start Date</label>
                <input
                  type="date"
                  required
                  value={announcementForm.expectedStart}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, expectedStart: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  value={announcementForm.description}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForms}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Add Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scholarships List */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Scholarships</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scholarships.map((scholarship) => (
              <div key={scholarship.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-2">{scholarship.title}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        scholarship.category === 'Government' ? 'bg-blue-100 text-blue-800' :
                        scholarship.category === 'Private' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {scholarship.category}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                        {scholarship.level}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditScholarship(scholarship)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteScholarship(scholarship.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>₦{scholarship.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{scholarship.slots} slots</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{scholarship.state}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Deadline: {new Date(scholarship.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Announcements List */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Announcements</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-2">{announcement.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{announcement.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    announcement.category === 'Government' ? 'bg-blue-100 text-blue-800' :
                    announcement.category === 'Private' ? 'bg-purple-100 text-purple-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {announcement.category}
                  </span>
                  <span>Expected: {new Date(announcement.expectedStart).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Automation Section */}
      {showAutomation && (
        <div className="border-t border-gray-200 pt-8">
          <ScholarshipAutomationAdmin />
        </div>
      )}
    </div>
  );
}
