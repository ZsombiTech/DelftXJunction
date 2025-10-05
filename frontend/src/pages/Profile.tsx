import React, { useState, useEffect } from "react";
import { useUpdateUserMutation } from "../redux/api/userApi";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/LoadingScreen";

export default function Profile() {
  const { user } = useAuth();
  const [updateProfile, { isLoading }] = useUpdateUserMutation();

  const [firstname, setFirstname] = useState(user?.firstname || "");
  const [lastname, setLastname] = useState(user?.lastname || "");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (user) {
      setFirstname(user.firstname || "");
      setLastname(user.lastname || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");

    try {
      await updateProfile({ firstname, lastname }).unwrap();
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-uber-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-uber-black">Profile</h1>

            <p className="mt-2 text-uber-gray-500">
              Manage your account information
            </p>
          </div>

          <button
            className="cursor-pointer bg-uber-black text-uber-white py-2 px-4 rounded-lg font-sm hover:bg-uber-gray-800 focus:outline-none focus:ring-2 focus:ring-uber-black focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => window.history.back()}
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-uber-white rounded-lg shadow-sm border border-uber-gray-200">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="firstname"
                  className="block text-sm font-medium text-uber-black mb-2"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstname"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  className="w-full px-4 py-3 border border-uber-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uber-black focus:border-transparent transition-all"
                  placeholder="Enter your first name"
                />
              </div>

              <div>
                <label
                  htmlFor="lastname"
                  className="block text-sm font-medium text-uber-black mb-2"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastname"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  className="w-full px-4 py-3 border border-uber-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uber-black focus:border-transparent transition-all"
                  placeholder="Enter your last name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-uber-gray-400 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 border border-uber-gray-200 rounded-lg bg-uber-gray-50 text-uber-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-uber-gray-400 mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value="••••••••"
                  disabled
                  className="w-full px-4 py-3 border border-uber-gray-200 rounded-lg bg-uber-gray-50 text-uber-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer w-full bg-uber-black text-uber-white py-3 px-4 rounded-lg font-medium hover:bg-uber-gray-800 focus:outline-none focus:ring-2 focus:ring-uber-black focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-uber-gray-500">
            Need to change your email or password?{" "}
            <a
              href="mailto:nyeldleagecim@gmail.com"
              target="_blank"
              className="text-uber-black font-medium hover:underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
