import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, upsertUserProfile, uploadAvatar, getNotifications, markNotificationRead } from '../services/profileService';
import { updatePassword, updateEmail, deleteUser } from 'firebase/auth';
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Camera, 
  Save, 
  Trash2, 
  Eye, 
  EyeOff,
  Moon,
  Sun,
  Globe,
  Shield,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    displayName: '',
    bio: '',
    occupation: '',
    preferredLanguage: 'English',
    photoURL: ''
  });

  // Settings state
  const [settings, setSettings] = useState({
    darkMode: false,
    emailNotifications: true,
    pushNotifications: true,
    language: 'English'
  });

  // Form state
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    newEmail: ''
  });

  const languages = [
    { code: 'English', name: 'English' },
    { code: 'Yoruba', name: 'Yoruba' },
    { code: 'Igbo', name: 'Igbo' },
    { code: 'Hausa', name: 'Hausa' }
  ];

  const occupations = [
    'Student',
    'Teacher',
    'Parent',
    'Career Counselor',
    'Education Professional',
    'Other'
  ];

  useEffect(() => {
    if (user) {
      loadProfile();
      loadNotifications();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await getUserProfile(user.uid);
      if (userProfile) {
        setProfile(prev => ({
          ...prev,
          ...userProfile
        }));
      } else {
        // Initialize with user data
        setProfile(prev => ({
          ...prev,
          displayName: user.displayName || '',
          photoURL: user.photoURL || ''
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const notifs = await getNotifications(user.uid);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setSaving(true);
      await upsertUserProfile(user.uid, profile);
      // Show success message
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        setSaving(true);
        const url = await uploadAvatar(user.uid, file);
        setProfile(prev => ({ ...prev, photoURL: url }));
      } catch (error) {
        console.error('Error uploading avatar:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handlePasswordChange = async () => {
    try {
      setSaving(true);
      await updatePassword(user, formData.newPassword);
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      // Show success message
    } catch (error) {
      console.error('Error changing password:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    try {
      setSaving(true);
      await updateEmail(user, formData.newEmail);
      setFormData(prev => ({ ...prev, newEmail: '' }));
      // Show success message
    } catch (error) {
      console.error('Error changing email:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      await deleteUser(user);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      await markNotificationRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setShowNotifications(false);
      
      // Navigate based on notification type
      if (notification.type === 'forum') {
        navigate(`/forum/post/${notification.postId}`);
      } else if (notification.type === 'scholarship') {
        navigate('/scholarships');
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Settings & Profile</h1>
            </div>
            
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 relative"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-3">Notifications</h3>
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No notifications</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {notifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              notification.read ? 'bg-gray-50' : 'bg-blue-50'
                            } hover:bg-gray-100`}
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notification.createdAt?.toDate()).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
                             {[
                 { id: 'profile', label: 'Profile', icon: User },
                 { id: 'account', label: 'Account', icon: SettingsIcon },
                 { id: 'preferences', label: 'Preferences', icon: Globe },
                 { id: 'security', label: 'Security', icon: Shield }
               ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    activeTab === tab.id
                      ? 'bg-red-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
                  
                  {/* Avatar Section */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img
                          src={profile.photoURL || `https://via.placeholder.com/80/FF0000/FFFFFF?text=${profile.displayName?.charAt(0) || 'U'}`}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                        <label className="absolute bottom-0 right-0 bg-red-500 text-white p-1 rounded-full cursor-pointer hover:bg-red-600">
                          <Camera className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">{profile.displayName || 'User'}</h3>
                        <p className="text-gray-600">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={profile.displayName}
                        onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Occupation
                      </label>
                      <select
                        value={profile.occupation}
                        onChange={(e) => setProfile(prev => ({ ...prev, occupation: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Select occupation</option>
                        {occupations.map(occ => (
                          <option key={occ} value={occ}>{occ}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Language
                      </label>
                      <select
                        value={profile.preferredLanguage}
                        onChange={(e) => setProfile(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        {languages.map(lang => (
                          <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={handleProfileUpdate}
                      disabled={saving}
                      className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      <Save className="w-5 h-5" />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
                  
                  <div className="space-y-6">
                    {/* Change Email */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Change Email</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="email"
                          placeholder="New email address"
                          value={formData.newEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, newEmail: e.target.value }))}
                          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                        <button
                          onClick={handleEmailChange}
                          disabled={saving || !formData.newEmail}
                          className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                          {saving ? 'Updating...' : 'Update Email'}
                        </button>
                      </div>
                    </div>

                    {/* Change Password */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Change Password</h3>
                      <div className="space-y-4">
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="New password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        <button
                          onClick={handlePasswordChange}
                          disabled={saving || !formData.newPassword}
                          className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                          {saving ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </div>

                    {/* Delete Account */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
                      <p className="text-gray-600 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center space-x-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span>Delete Account</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">App Preferences</h2>
                  
                  <div className="space-y-6">
                    {/* Dark Mode */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Dark Mode</h3>
                        <p className="text-gray-600">Switch between light and dark themes</p>
                      </div>
                      <button
                        onClick={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.darkMode ? 'bg-red-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Language */}
                    <div>
                      <h3 className="text-lg font-medium mb-2">Language</h3>
                      <select
                        value={settings.language}
                        onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        {languages.map(lang => (
                          <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Notifications */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Notifications</h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Email Notifications</h4>
                          <p className="text-gray-600">Receive updates via email</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.emailNotifications ? 'bg-red-500' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Push Notifications</h4>
                          <p className="text-gray-600">Receive push notifications</p>
                        </div>
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, pushNotifications: !prev.pushNotifications }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.pushNotifications ? 'bg-red-500' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                  
                  <div className="space-y-6">
                    {/* Recent Activity */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Recent Login Activity</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Current Session</p>
                            <p className="text-sm text-gray-600">
                              {user?.metadata?.lastSignInTime ? 
                                new Date(user.metadata.lastSignInTime).toLocaleString() : 
                                'Unknown'
                              }
                            </p>
                          </div>
                          <div className="text-green-500 text-sm font-medium">Active</div>
                        </div>
                      </div>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div>
                      <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">2FA Status</p>
                            <p className="text-sm text-gray-600">Add an extra layer of security</p>
                          </div>
                          <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                            Coming Soon
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Logout */}
                    <div className="border-t pt-6">
                      <button
                        onClick={logout}
                        className="flex items-center space-x-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Delete Account</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
