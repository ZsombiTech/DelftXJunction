import { Calendar, UserPen, HandCoins } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    signOut();
    navigate("/login");
  };

  return (
    <header className="bg-uber-black text-uber-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center flex-wrap gap-10">
        <h1
          className="text-2xl font-bold cursor-pointer"
          onClick={() => navigate("/")}
        >
          Uber Auto Dashboard
        </h1>
        <div className="flex items-center space-x-10 shrink-0">
          <div className="flex items-center space-x-4">
            <HandCoins
              className="cursor-pointer h-6 w-6 text-uber-white"
              onClick={() => navigate("/eventpredicter")}
            />
            <div className="w-px h-6 bg-uber-gray-700" />
            <Calendar
              className="cursor-pointer h-6 w-6 text-uber-white"
              onClick={() => navigate("/timetable")}
            />
            <div className="w-px h-6 bg-uber-gray-700" />
            <UserPen
              className="cursor-pointer h-6 w-6 text-uber-white"
              onClick={() => navigate("/profile")}
            />
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-uber-white text-uber-black cursor-pointer rounded-md font-medium hover:bg-uber-gray-100 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
