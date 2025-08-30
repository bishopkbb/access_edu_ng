// Frontend service for communicating with the backend scholarship automation API
// Provides functions used by ScholarshipAutomationAdmin to fetch external data

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const handleResponse = async (response) => {
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return response.json();
};

export const fetchExternalScholarships = async (sourceType = "all") => {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/scholarships/fetch-external`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceType })
    });
    const data = await handleResponse(res);
    // Normalize to include added count (frontend may add later to Firestore)
    return { total: data.count || 0, added: 0, scholarships: data.scholarships || [] };
  } catch (error) {
    console.error("fetchExternalScholarships error:", error);
    throw error;
  }
};

export const getAutomationLogs = async (limit = 50) => {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/scholarships/automation-logs?limit=${encodeURIComponent(limit)}`);
    const data = await handleResponse(res);
    // Map to the UI shape
    return (data.logs || []).map((log) => ({
      status: log.status || "active",
      message: `${log.action || "Action"} - ${log.source || "Source"} (${log.count || 0})`,
      source: log.source || "Unknown",
      timestamp: log.timestamp || new Date().toISOString(),
      duration: log.duration ? Math.round((log.duration || 0) / 1000) : undefined
    }));
  } catch (error) {
    console.error("getAutomationLogs error:", error);
    throw error;
  }
};

export const getAutomationStats = async () => {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/scholarships/automation-stats`);
    const data = await handleResponse(res);
    return data.stats || null;
  } catch (error) {
    console.error("getAutomationStats error:", error);
    throw error;
  }
};

export const getAutomationConfig = async () => {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/scholarships/automation-config`);
    const data = await handleResponse(res);
    // Transform to UI-friendly structure
    const cfg = data.config || {};
    return {
      schedule: { interval: 6, enabled: cfg.enabled !== false },
      sources: [
        { name: "Web Scraping", enabled: cfg.sources?.webScraping !== false },
        { name: "RSS Feeds", enabled: cfg.sources?.rssFeeds !== false },
        { name: "External APIs", enabled: cfg.sources?.externalAPIs !== false }
      ]
    };
  } catch (error) {
    console.error("getAutomationConfig error:", error);
    throw error;
  }
};

export const updateAutomationConfig = async (config) => {
  try {
    const body = {
      schedule: config?.schedule,
      enabled: config?.schedule?.enabled,
      sources: {
        webScraping: !!config?.sources?.find((s) => s.name === "Web Scraping")?.enabled,
        rssFeeds: !!config?.sources?.find((s) => s.name === "RSS Feeds")?.enabled,
        externalAPIs: !!config?.sources?.find((s) => s.name === "External APIs")?.enabled
      }
    };
    const res = await fetch(`${BACKEND_BASE_URL}/api/scholarships/automation-config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await handleResponse(res);
    return data;
  } catch (error) {
    console.error("updateAutomationConfig error:", error);
    throw error;
  }
};

export const testSource = async ({ name, url, type, selectors }) => {
  try {
    // If only name is provided, hit backend with minimal body
    const res = await fetch(`${BACKEND_BASE_URL}/api/scholarships/test-source`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceConfig: { name, url, type, selectors } })
    });
    const data = await handleResponse(res);
    return { message: `Found ${data.count || 0} items from ${data.source || name}` };
  } catch (error) {
    console.error("testSource error:", error);
    throw error;
  }
};

export const triggerSourceAutomation = async (sourceName) => {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/scholarships/trigger-source`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceName })
    });
    const data = await handleResponse(res);
    return { message: `Triggered ${data.source || sourceName} - ${data.count || 0} items` };
  } catch (error) {
    console.error("triggerSourceAutomation error:", error);
    throw error;
  }
};

// Optional helpers used by scholarshipAutomationService fallback imports
export const scrapeWebsite = async (url, selectors) => {
  const res = await fetch(`${BACKEND_BASE_URL}/api/scholarships/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, selectors })
  });
  const data = await handleResponse(res);
  return data.scholarships || [];
};

export const fetchRSSFeed = async (feedUrl) => {
  const res = await fetch(`${BACKEND_BASE_URL}/api/scholarships/rss`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feedUrl })
  });
  const data = await handleResponse(res);
  return data.scholarships || [];
};

export const callExternalAPI = async ({ apiUrl, headers = {}, params = {} }) => {
  const res = await fetch(`${BACKEND_BASE_URL}/api/scholarships/external-api`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiUrl, headers, params })
  });
  const data = await handleResponse(res);
  return data.scholarships || [];
};


