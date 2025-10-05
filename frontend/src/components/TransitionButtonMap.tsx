// TransitionButton.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MapPage from "./MapPage"; // Your react-map-gl component
import { useAuth } from "../hooks/useAuth";
import {
  useStartTimeslotMutation,
  useEndTimeslotMutation,
} from "../redux/api/timeslotApi";
import LoadingScreen from "./LoadingScreen";

const BUTTON_INITIAL_DIMENSIONS = {
  width: 64,
  height: 64,
  borderRadius: 9999,
  bottom: 32,
  right: 32,
};

const TransitionButton: React.FC = () => {
  const { user } = useAuth();

  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTimeslotId, setCurrentTimeslotId] = useState<number | null>(
    null
  );

  const [startTimeslot, { isLoading: isStarting }] = useStartTimeslotMutation();
  const [endTimeslot, { isLoading: isEnding }] = useEndTimeslotMutation();

  const handleEarnClick = async () => {
    if (user?.isBreakMode) {
      return;
    }
    try {
      const result = await startTimeslot().unwrap();
      setCurrentTimeslotId(result.timeslot_id);
      setIsExpanded(true);
    } catch (error) {
      console.error("Failed to start timeslot:", error);
      // Still expand the map even if timeslot creation fails
      setIsExpanded(true);
    }
  };

  const handleClose = async () => {
    if (currentTimeslotId) {
      try {
        await endTimeslot(currentTimeslotId).unwrap();
      } catch (error) {
        console.error("Failed to end timeslot:", error);
      }
    }
    setIsExpanded(false);
    setCurrentTimeslotId(null);
  };

  if (isStarting || isEnding) {
    return <LoadingScreen />;
  }

  return (
    <AnimatePresence>
      {isExpanded ? (
        <motion.div
          key="map-container"
          className="fixed z-[999] bg-white"
          initial={{
            width: BUTTON_INITIAL_DIMENSIONS.width,
            height: BUTTON_INITIAL_DIMENSIONS.height,
            bottom: BUTTON_INITIAL_DIMENSIONS.bottom,
            right: BUTTON_INITIAL_DIMENSIONS.right,
            borderRadius: BUTTON_INITIAL_DIMENSIONS.borderRadius,
          }}
          animate={{
            width: "100vw",
            height: "100vh",
            bottom: 0,
            right: 0,
            borderRadius: 0,
          }}
          exit={{
            width: BUTTON_INITIAL_DIMENSIONS.width,
            height: BUTTON_INITIAL_DIMENSIONS.height,
            bottom: BUTTON_INITIAL_DIMENSIONS.bottom,
            right: BUTTON_INITIAL_DIMENSIONS.right,
            borderRadius: BUTTON_INITIAL_DIMENSIONS.borderRadius,
          }}
          transition={{
            duration: 0.6,
            ease: [0.4, 0, 0.2, 1],
          }}
          onAnimationComplete={() => {
            window.dispatchEvent(new Event("resize"));
          }}
        >
          <MapPage
            onClose={handleClose}
            start={[4.895168, 52.370216]}
            waypoints={[
              [4.9041, 52.3676],
              [4.9141, 52.365],
            ]}
            driverName={`${user?.firstname || "Driver"} ${user?.lastname}`}
          />
        </motion.div>
      ) : (
        <motion.button
          key="earn-button"
          onClick={handleEarnClick}
          className={`
            fixed bottom-8 right-8 w-20 h-20 rounded-full text-xl
            bg-black text-white font-bold text-sm z-[999] 
            flex items-center justify-center 
            shadow-xl transition-transform duration-300
            ${user?.isBreakMode ? "bg-gray-400 cursor-not-allowed" : "hover:scale-105 cursor-pointer"}
          `}
          initial={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          Earn
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default TransitionButton;
