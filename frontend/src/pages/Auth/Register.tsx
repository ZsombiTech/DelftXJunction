import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import UberLogo from "../../assets/images/uberlogo.webp";
import LoadingScreen from "../../components/LoadingScreen";

const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-uber-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={UberLogo}
            alt="Uber Auto Logo"
            className="mx-auto h-32 w-auto"
          />
          <h1 className="text-4xl font-bold text-uber-white">Register</h1>
        </div>

        <div className="bg-uber-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                Account created successfully! Redirecting to login...
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-uber-gray-900 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-uber-gray-50 border border-uber-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-uber-black focus:border-transparent transition"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-uber-gray-900 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-uber-gray-50 border border-uber-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-uber-black focus:border-transparent transition"
                placeholder="Create a password (min. 6 characters)"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-uber-gray-900 mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-uber-gray-50 border border-uber-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-uber-black focus:border-transparent transition"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="cursor-pointer w-full bg-uber-black text-uber-white py-3 px-4 rounded-md font-medium hover:bg-uber-gray-900 focus:outline-none focus:ring-2 focus:ring-uber-black focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || success ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-uber-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-uber-black hover:text-uber-gray-700 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
