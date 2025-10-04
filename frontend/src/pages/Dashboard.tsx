import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import MapViewer from "../components/MapViewer";
import TransitionButtonMap from "../components/TransitionButtonMap";
import RestAlertModal from "../components/RestAlertModal";
import BreakModeToggle from "../components/BreakModeToggle";
import { useToggleBreakModeMutation } from "../redux/api/userApi";
import LoadingScreen from "../components/LoadingScreen";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const [isBreakMode, setIsBreakMode] = useState(false);
  const [isShowRestModal, setIsShowRestModal] = useState(false);

  const [toggleBreakMode, { isLoading }] = useToggleBreakModeMutation();
  const { data: statistics, error } = useFetchStatisticsQuery();

  useEffect(() => {
    if (user) {
      setIsBreakMode(user.isBreakMode || false);

      if (user.isBreakMode) {
        setIsShowRestModal(false);
      } else {
        setIsShowRestModal(user.isRestNow || false);
      }
    }
  }, [user]);

  const handleTakeBreak = async () => {
    await toggleBreakMode();
    setIsShowRestModal(false);
  };

  const handleDriveOn = () => {
    setIsShowRestModal(false);
  };

  
  const handleToggleBreakMode = async (checked: boolean) => {
    setIsBreakMode(checked);
    await toggleBreakMode();
  };

  if (isLoading) {
    return <LoadingScreen />;
  }



  return (
    <div className="min-h-screen bg-uber-gray-50">
      <RestAlertModal
        isOpen={isShowRestModal}
        onTakeBreak={handleTakeBreak}
        onDriveOn={handleDriveOn}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-uber-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-6">
            <div>
              <h2 className="text-3xl font-semibold text-uber-gray-900 mb-4">
                Welcome!
              </h2>
              {/* Flex container for the welcome text and the new toggle */}

              <p className="text-uber-gray-600">
                You are logged in as:{" "}
                <span className="font-medium text-uber-gray-900">
                  {user?.email}
                </span>
              </p>
            </div>

            {/* The new Break Mode Toggle component */}
            <BreakModeToggle
              isChecked={isBreakMode}
              onToggle={handleToggleBreakMode}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ... (Existing Earnings, Trips, and Rating blocks) ... */}
          <div className="bg-uber-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-uber-gray-900 mb-2">
              Earnings
            </h3>
            <p className="text-3xl font-bold text-uber-black">
              ${statistics?.earner.totalEarnings?.toFixed(2) || "0.00"}
            </p>
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
            <p className="text-3xl font-bold text-uber-black">
              {statistics?.earner.rating?.toFixed(2) || "0.00"}
            </p>
            <p className="text-sm text-uber-gray-500 mt-2">Average rating</p>
          </div>
        </div>

        <div className="h-96 mt-6 rounded-lg overflow-hidden shadow-md">
          <MapViewer />
        </div>
      </main>

      <TransitionButtonMap />
    </div>
  );
};

export default Dashboard;
