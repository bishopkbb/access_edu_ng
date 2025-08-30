import { useState, useEffect } from "react";
import { 
  triggerManualAutomation, 
  getAutomationStatus 
} from "../services/scholarshipAutomationService";
import {
  fetchExternalScholarships,
  getAutomationLogs,
  getAutomationStats,
  updateAutomationConfig,
  getAutomationConfig,
  testSource,
  triggerSourceAutomation
} from "../services/scholarshipBackendService";
import {
  Play,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Globe,
  Rss,
  Zap,
  Calendar,
  Users,
  TrendingUp,
  Activity,
  Eye,
  EyeOff,
  Save,
  TestTube
} from "lucide-react";

export default function ScholarshipAutomationAdmin() {
  const [automationStatus, setAutomationStatus] = useState(null);
  const [automationStats, setAutomationStats] = useState(null);
  const [automationLogs, setAutomationLogs] = useState([]);
  const [automationConfig, setAutomationConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [message, setMessage] = useState("");

  // Load initial data
  useEffect(() => {
    loadAutomationData();
  }, []);

  const loadAutomationData = async () => {
    setLoading(true);
    try {
      const [status, stats, logs, config] = await Promise.all([
        getAutomationStatus(),
        getAutomationStats().catch(() => null),
        getAutomationLogs(20).catch(() => []),
        getAutomationConfig().catch(() => null)
      ]);
      
      setAutomationStatus(status);
      setAutomationStats(stats);
      setAutomationLogs(logs);
      setAutomationConfig(config);
    } catch (error) {
      console.error("Error loading automation data:", error);
      setMessage("Error loading automation data");
    } finally {
      setLoading(false);
    }
  };

  const handleManualAutomation = async () => {
    setRunningAutomation(true);
    setMessage("");
    
    try {
      const result = await triggerManualAutomation();
      if (result.success) {
        setMessage(`Automation completed successfully! Added ${result.added} new scholarships.`);
        await loadAutomationData(); // Refresh data
      } else {
        setMessage(`Automation failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error running automation:", error);
      setMessage("Error running automation");
    } finally {
      setRunningAutomation(false);
    }
  };

  const handleExternalFetch = async (sourceType) => {
    setRunningAutomation(true);
    setMessage("");
    
    try {
      const result = await fetchExternalScholarships(sourceType);
      setMessage(`External fetch completed! Found ${result.total} scholarships, added ${result.added} new ones.`);
      await loadAutomationData(); // Refresh data
    } catch (error) {
      console.error("Error fetching external scholarships:", error);
      setMessage("Error fetching external scholarships");
    } finally {
      setRunningAutomation(false);
    }
  };

  const handleTestSource = async (sourceName) => {
    setMessage("");
    
    try {
      const result = await testSource({ name: sourceName });
      setMessage(`Source test completed: ${result.message}`);
    } catch (error) {
      console.error("Error testing source:", error);
      setMessage("Error testing source");
    }
  };

  const handleTriggerSource = async (sourceName) => {
    setRunningAutomation(true);
    setMessage("");
    
    try {
      const result = await triggerSourceAutomation(sourceName);
      setMessage(`Source automation completed: ${result.message}`);
      await loadAutomationData(); // Refresh data
    } catch (error) {
      console.error("Error triggering source:", error);
      setMessage("Error triggering source automation");
    } finally {
      setRunningAutomation(false);
    }
  };

  const handleUpdateConfig = async (newConfig) => {
    try {
      await updateAutomationConfig(newConfig);
      setMessage("Configuration updated successfully!");
      await loadAutomationData(); // Refresh data
    } catch (error) {
      console.error("Error updating config:", error);
      setMessage("Error updating configuration");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Scholarship Automation</h1>
        <p className="text-gray-600">Manage automated scholarship collection from external sources</p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('Error') || message.includes('failed') 
            ? 'bg-red-50 border border-red-200 text-red-700' 
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Manual Trigger</h3>
            <Play className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-gray-600 mb-4">Run automation manually to collect new scholarships</p>
          <button
            onClick={handleManualAutomation}
            disabled={runningAutomation}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {runningAutomation ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run Automation</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">External Sources</h3>
            <Globe className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-gray-600 mb-4">Fetch from external scholarship sources</p>
          <div className="space-y-2">
            <button
              onClick={() => handleExternalFetch('scrape')}
              disabled={runningAutomation}
              className="w-full px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Web Scraping
            </button>
            <button
              onClick={() => handleExternalFetch('rss')}
              disabled={runningAutomation}
              className="w-full px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              RSS Feeds
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Configuration</h3>
            <Settings className="w-6 h-6 text-orange-500" />
          </div>
          <p className="text-gray-600 mb-4">Manage automation settings and sources</p>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center justify-center space-x-2"
          >
            {showConfig ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showConfig ? 'Hide' : 'Show'} Config</span>
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Statistics</h3>
            <BarChart3 className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-gray-600 mb-4">View automation performance metrics</p>
          <button
            onClick={loadAutomationData}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && automationConfig && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Automation Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Schedule Settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600">Run Interval (hours)</label>
                  <input
                    type="number"
                    value={automationConfig.schedule?.interval || 6}
                    onChange={(e) => setAutomationConfig({
                      ...automationConfig,
                      schedule: { ...automationConfig.schedule, interval: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Enabled</label>
                  <input
                    type="checkbox"
                    checked={automationConfig.schedule?.enabled || false}
                    onChange={(e) => setAutomationConfig({
                      ...automationConfig,
                      schedule: { ...automationConfig.schedule, enabled: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Auto-run scheduled automation</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Source Settings</h4>
              <div className="space-y-3">
                {automationConfig.sources?.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-800">{source.name}</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${
                        source.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {source.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleTestSource(source.name)}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        <TestTube className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleTriggerSource(source.name)}
                        disabled={runningAutomation}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        <Zap className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => handleUpdateConfig(automationConfig)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      {automationStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Automated</p>
                <p className="text-2xl font-bold text-gray-800">{automationStats.totalAutomated || 0}</p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last Run</p>
                <p className="text-sm font-medium text-gray-800">
                  {automationStats.lastRun ? formatDate(automationStats.lastRun) : 'Never'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-800">
                  {automationStats.successRate ? `${automationStats.successRate}%` : 'N/A'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Sources</p>
                <p className="text-2xl font-bold text-gray-800">{automationStats.activeSources || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Logs */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Automation Logs</h3>
        {automationLogs.length > 0 ? (
          <div className="space-y-3">
            {automationLogs.map((log, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(log.status)}
                  <div>
                    <p className="font-medium text-gray-800">{log.message}</p>
                    <p className="text-sm text-gray-600">{formatDate(log.timestamp)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{log.source}</p>
                  {log.duration && (
                    <p className="text-xs text-gray-500">{formatDuration(log.duration)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No automation logs available</p>
        )}
      </div>
    </div>
  );
}

