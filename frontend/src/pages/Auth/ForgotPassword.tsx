import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import UberLogo from "../../assets/images/uberlogo.webp";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-uber-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <img
            src={UberLogo}
            alt="Uber Auto Logo"
            className="mx-auto h-32 w-auto"
          />

          <h1 className="text-4xl font-bold text-uber-white mb-2">
            Reset Password
          </h1>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-uber-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-uber-gray-900 mb-2">
              Forgot password?
            </h2>
            <p className="text-sm text-uber-gray-600">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                Password reset link sent! Please check your email inbox.
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-uber-black text-uber-white py-3 px-4 rounded-md font-medium hover:bg-uber-gray-900 focus:outline-none focus:ring-2 focus:ring-uber-black focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-uber-black hover:text-uber-gray-700 font-medium"
            >
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
