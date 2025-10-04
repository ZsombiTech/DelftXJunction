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
  );
}
