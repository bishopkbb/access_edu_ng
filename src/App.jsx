// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Quiz from "./pages/quiz";
import Scholarships from "./pages/scholarships";
import TVET from "./pages/tvet";
import TvetAdmin from "./pages/tvetAdmin";
import Forum from "./pages/forum";
import ForumPost from "./pages/forumPost";
import Settings from "./pages/settings";
import About from "./pages/About";
import SDG4Section from "./components/About/SDG4Section";
import CreditSection from "./components/About/CreditsSection";
import SubscriptionPage from "./pages/subscription";
import SubscriptionManagementPage from "./pages/subscriptionManagement";
import Notifications from "./pages/notifications";

function App() {
  const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/" replace />;
    return children;
  };

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz"
        element={
          <ProtectedRoute>
            <Quiz />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scholarships"
        element={
          <ProtectedRoute>
            <Scholarships />
          </ProtectedRoute>
        }
      />
      <Route path="/tvet" element={<TVET />} />
      <Route
        path="/admin/tvet"
        element={
          <ProtectedRoute>
            <TvetAdmin />
          </ProtectedRoute>
        }
      />
      <Route path="/forum" element={<Forum />} />
      <Route path="/forum/post/:postId" element={<ForumPost />} />
      <Route path="/about" element={<About />} />
      <Route path="/sdg4" element={<SDG4Section />} />      {/* ✅ Fixed path */}
      <Route path="/credits" element={<CreditSection />} /> {/* ✅ Fixed path */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute>
            <SubscriptionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription/management"
        element={
          <ProtectedRoute>
            <SubscriptionManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
