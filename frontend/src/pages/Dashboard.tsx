import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-uber-gray-50">
      {/* Header */}
      <header className="bg-uber-black text-uber-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Smart Earner Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-uber-white text-uber-black cursor-pointer rounded-md font-medium hover:bg-uber-gray-100 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-uber-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-uber-gray-900 mb-4">
            Welcome!
          </h2>
          <p className="text-uber-gray-600">
            You are logged in as:{" "}
            <span className="font-medium text-uber-gray-900">
              {user?.email}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-uber-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-uber-gray-900 mb-2">
              Earnings
            </h3>
            <p className="text-3xl font-bold text-uber-black">$0.00</p>
            <p className="text-sm text-uber-gray-500 mt-2">Total earnings</p>
          </div>

          <div className="bg-uber-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-uber-gray-900 mb-2">
              Trips
            </h3>
            <p className="text-3xl font-bold text-uber-black">0</p>
            <p className="text-sm text-uber-gray-500 mt-2">Completed trips</p>
          </div>

          <div className="bg-uber-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-uber-gray-900 mb-2">
              Rating
            </h3>
            <p className="text-3xl font-bold text-uber-black">5.0</p>
            <p className="text-sm text-uber-gray-500 mt-2">Average rating</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
