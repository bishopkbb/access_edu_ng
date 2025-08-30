import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider, firebaseEnvOk } from "../firebaseConfig";
import { initializeUserData } from "../services/userDataService";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  sendPasswordResetEmail,
  sendEmailVerification
} from "firebase/auth";
import { BookOpen, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resetCooldown, setResetCooldown] = useState(0);
  const [resetTimerId, setResetTimerId] = useState(null);
  const [verifyCooldown, setVerifyCooldown] = useState(0);
  const [showVerifyActions, setShowVerifyActions] = useState(false);
  const configOk = firebaseEnvOk;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError("");
    if (info) setInfo("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords don't match");
          setLoading(false);
          return;
        }
                          const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
          try {
            await sendEmailVerification(cred.user);
            setInfo("Verification email sent. Please verify your email before logging in.");
            setShowVerifyActions(true);
          } catch (ve) {
            setError(mapAuthError(ve) || "Could not send verification email");
          }
          
          // Initialize user data in Firestore
          try {
            await initializeUserData(cred.user.uid, formData.email);
          } catch (dataError) {
            console.error("Error initializing user data:", dataError);
            // Don't block navigation if data initialization fails
          }
          
          // For now, let them proceed to dashboard even if verification fails
          navigate("/dashboard");
             } else {
         const cred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
         // Allow login even if email not verified, just show a prompt
         if (!cred.user?.emailVerified && !cred.user?.isAnonymous) {
           setInfo("Welcome back! Please verify your email for full access. Check your inbox.");
           setShowVerifyActions(true);
         }
         navigate("/dashboard");
       }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError("");
    setInfo("");
    if (verifyCooldown > 0) return;
    if (!auth.currentUser) {
      setError("Log in first to resend verification email");
      return;
    }
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setInfo("Verification email re-sent. Check your inbox.");
      setVerifyCooldown(30);
      const id = setInterval(() => {
        setVerifyCooldown((s) => {
          if (s <= 1) {
            clearInterval(id);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      setError(mapAuthError(err) || "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
             const cred = await signInWithPopup(auth, provider);
       
       // Initialize user data if it's a new Google user
       try {
         await initializeUserData(cred.user.uid, cred.user.email);
       } catch (dataError) {
         console.error("Error initializing user data:", dataError);
         // Don't block navigation if data initialization fails
       }
       
       navigate("/dashboard");
    } catch (err) {
      setError(mapAuthError(err) || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
             const cred = await signInAnonymously(auth);
       
       // Initialize user data for anonymous user
       try {
         await initializeUserData(cred.user.uid, "anonymous@guest.com");
       } catch (dataError) {
         console.error("Error initializing user data:", dataError);
         // Don't block navigation if data initialization fails
       }
       
       navigate("/dashboard");
    } catch (err) {
      setError(mapAuthError(err) || "Guest sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError("");
    setInfo("");
    if (!formData.email) {
      setError("Enter your email above to reset your password");
      return;
    }
    if (resetCooldown > 0) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setInfo("Password reset email sent. Check your inbox.");
      setResetCooldown(60);
      const id = setInterval(() => {
        setResetCooldown((s) => {
          if (s <= 1) {
            clearInterval(id);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      setResetTimerId(id);
    } catch (err) {
      setError(mapAuthError(err) || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  function mapAuthError(err) {
    const code = err?.code || "";
    switch (code) {
      case "auth/configuration-not-found":
        return "Email provider/config not set. Enable Email/Password and add your domain in Firebase Auth → Sign-in method and Authorized domains.";
      case "auth/admin-restricted-operation":
        return "Anonymous auth disabled. Enable Anonymous in Firebase → Authentication → Sign-in method → Anonymous → Enable.";
      case "auth/invalid-email":
        return "Invalid email address";
      case "auth/user-disabled":
        return "This user account is disabled";
      case "auth/user-not-found":
        return "No user found with this email";
      case "auth/wrong-password":
        return "Incorrect password";
      case "auth/email-already-in-use":
        return "Email is already in use";
      case "auth/weak-password":
        return "Password should be at least 6 characters";
      case "auth/popup-closed-by-user":
        return "Sign-in was canceled";
      default:
        return err?.message || "Something went wrong";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Centered Login Container */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left Panel - Brand Section */}
          <div className="lg:w-1/2 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center p-8 lg:p-12">
            <div className="text-center text-white">
              <div className="flex items-center justify-center mb-6 lg:mb-8">
                <BookOpen className="w-12 h-12 lg:w-16 lg:h-16 mr-3 lg:mr-4" />
                <h1 className="text-3xl lg:text-5xl font-bold">AccessEdu NG</h1>
              </div>
              <p className="text-lg lg:text-xl opacity-90 max-w-md">
                Democratizing access to scholarships and learning for Nigerian students
              </p>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-8">
            <div className="w-full max-w-md">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-6 lg:mb-8">
                    {isSignUp ? "Sign up" : "Log in"}
                  </h2>

                  {(!configOk) && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                      Firebase config missing/invalid. Check your .env values, then restart the dev server. Also enable providers in Firebase Console.
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                      {error}
                    </div>
                  )}
                </div>

            <div className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field (Sign Up Only) */}
              {isSignUp && (
                <div className="overflow-hidden transition-all duration-300">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="Confirm your password"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !configOk}
                className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : isSignUp ? "Sign up" : "Log in"}
              </button>
            </div>

                {/* Social Login Options */}
                <div className="mt-5">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {/* Google Sign-in */}
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading || !configOk}
                      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      {loading ? "Loading..." : "Continue with Google"}
                    </button>

                    {/* Guest Login */}
                    <button
                      type="button"
                      onClick={handleGuestLogin}
                      disabled={loading || !configOk}
                      className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      {loading ? "Loading..." : "Continue as Guest"}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link (Login Only) */}
                {!isSignUp && (
                  <div className="text-center mt-5">
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={loading || resetCooldown > 0}
                      className="text-gray-600 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      {resetCooldown > 0 ? `Resend in ${resetCooldown}s` : "Forgot password?"}
                    </button>
                  </div>
                )}

                {/* Sign Up / Login Toggle */}
                <div className="text-center mt-5">
                  <span className="text-gray-500">or</span>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError("");
                        setFormData({ email: "", password: "", confirmPassword: "" });
                      }}
                      className="text-gray-800 font-semibold hover:text-red-500 transition-colors"
                    >
                      {isSignUp ? "Log in" : "Sign up"}
                    </button>
                  </div>
                </div>

                {(error || info) && (
                  <div className={`mt-5 px-4 py-3 rounded-lg border ${error ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    {error || info}
                  </div>
                )}

                {showVerifyActions && (
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={loading || verifyCooldown > 0}
                      className="text-gray-700 font-semibold hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      {verifyCooldown > 0 ? `Resend verification in ${verifyCooldown}s` : 'Resend verification email'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}