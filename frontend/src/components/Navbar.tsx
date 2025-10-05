import { useState } from "react";
import { Calendar, UserPen, HandCoins, Menu, X, Bot } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    signOut();
    navigate("/login");
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className="bg-uber-black text-uber-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Logo / Title */}
        <h1
          className="text-2xl font-bold cursor-pointer"
          onClick={() => navigate("/")}
        >
          Uber Auto Dashboard
        </h1>

        {/* Hamburger icon (mobile only) */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-uber-white focus:outline-none"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-10">
          <div className="flex items-center space-x-4">
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/copilot")}
            >
              <Bot className="h-6 w-6 text-uber-white" />
              <p className="font-medium">AI Copilot</p>
            </div>
            <div className="w-px h-6 bg-uber-gray-700" />
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/eventpredicter")}
            >
              <HandCoins className="h-6 w-6 text-uber-white" />
              <p className="font-medium">Event Predicter</p>
            </div>
            <div className="w-px h-6 bg-uber-gray-700" />
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/timetable")}
            >
              <Calendar className="h-6 w-6 text-uber-white" />
              <p className="font-medium">Timetable</p>
            </div>
            <div className="w-px h-6 bg-uber-gray-700" />
            <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/profile")}
            >
              <UserPen className="h-6 w-6 text-uber-white" />
              <p className="font-medium">Profile</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-uber-white text-uber-black rounded-md font-medium hover:bg-uber-gray-100 transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isOpen && (
        <div className="md:hidden bg-uber-black border-t border-uber-gray-800 flex flex-col space-y-4 py-4 px-6">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => {
              navigate("/copilot");
              setIsOpen(false);
            }}
          >
            <Bot className="h-6 w-6 text-uber-white" />
            <p className="font-medium">AI Copilot</p>
          </div>

          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => {
              navigate("/eventpredicter");
              setIsOpen(false);
            }}
          >
            <HandCoins className="h-6 w-6 text-uber-white" />
            <p className="font-medium">Event Predicter</p>
          </div>

          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => {
              navigate("/timetable");
              setIsOpen(false);
            }}
          >
            <Calendar className="h-6 w-6 text-uber-white" />
            <p className="font-medium">Timetable</p>
          </div>

          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => {
              navigate("/profile");
              setIsOpen(false);
            }}
          >
            <UserPen className="h-6 w-6 text-uber-white" />
            <p className="font-medium">Profile</p>
          </div>

          <button
            onClick={() => {
              handleSignOut();
              setIsOpen(false);
            }}
            className="w-full mt-2 px-4 py-2 bg-uber-white text-uber-black rounded-md font-medium hover:bg-uber-gray-100 transition"
          >
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
