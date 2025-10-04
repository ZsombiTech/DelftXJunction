// TransitionButton.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MapPage from "./MapPage"; // Your react-map-gl component
import { useAuth } from "../hooks/useAuth";
import {
  useStartTimeslotMutation,
  useEndTimeslotMutation,
} from "../redux/api/timeslotApi";

// Define the dimensions and position based on Tailwind classes
// w-16 = 64px, h-16 = 64px
// bottom-8 = 32px, right-8 = 32px
const BUTTON_INITIAL_DIMENSIONS = {
  width: 64,
  height: 64,
  borderRadius: 9999, // rounded-full

  // We define the position relative to the viewport (fixed)
  bottom: 32, // The fixed 'bottom-8' value in pixels
  right: 32, // The fixed 'right-8' value in pixels
};

const TransitionButton: React.FC = () => {
  const { user } = useAuth();

  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTimeslotId, setCurrentTimeslotId] = useState<number | null>(
    null
  );

  const [startTimeslot] = useStartTimeslotMutation();
  const [endTimeslot] = useEndTimeslotMutation();

  const handleEarnClick = async () => {
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

  return (
    <AnimatePresence>
      {isExpanded ? (
        // --- Expanded Map View ---
        <motion.div
          key="map-container"
          // We apply the final (expanded) screen classes here
          className="fixed z-[999] bg-white"
          initial={{
            // START STATE: Use the exact button dimensions and position
            width: BUTTON_INITIAL_DIMENSIONS.width,
            height: BUTTON_INITIAL_DIMENSIONS.height,
            bottom: BUTTON_INITIAL_DIMENSIONS.bottom,
            right: BUTTON_INITIAL_DIMENSIONS.right,
            borderRadius: BUTTON_INITIAL_DIMENSIONS.borderRadius,
            // Framer Motion handles the 'fixed' positioning, but we ensure
            // the initial calculated position is correct.
          }}
          animate={{
            // END STATE: Animate to cover the whole screen
            width: "100vw",
            height: "100vh",
            bottom: 0,
            right: 0,
            borderRadius: 0, // No border radius when full screen
          }}
          exit={{
            // EXIT STATE: Animate back to the button's position and size
            // when the map is closed.
            width: BUTTON_INITIAL_DIMENSIONS.width,
            height: BUTTON_INITIAL_DIMENSIONS.height,
            bottom: BUTTON_INITIAL_DIMENSIONS.bottom,
            right: BUTTON_INITIAL_DIMENSIONS.right,
            borderRadius: BUTTON_INITIAL_DIMENSIONS.borderRadius,
          }}
          transition={{
            duration: 0.6,
            ease: [0.4, 0, 0.2, 1], // Smooth cubic-bezier
          }}
          onAnimationComplete={() => {
            // Trigger a resize event to ensure the map adjusts properly
            window.dispatchEvent(new Event("resize"));
          }}
        >
          <MapPage
            onClose={handleClose}
            start={[4.895168, 52.370216]} // Amsterdam
            waypoints={[
              [4.9041, 52.3676], // some coordinates in Amsterdam
              [4.9141, 52.365], // another destination
            ]}
            driverName={`${user?.firstname || "Driver"} ${user?.lastname}`} // Pass the user's name or a default
          />
        </motion.div>
      ) : (
        // --- Initial "Earn" Button ---
        <motion.button
          key="earn-button"
          onClick={handleEarnClick}
          className={`
            fixed bottom-8 right-8 w-20 h-20 rounded-full text-xl
            bg-black text-white font-bold text-sm z-50 
            flex items-center justify-center 
            shadow-xl cursor-pointer transition-transform duration-300
          `}
          // The button fades out as the map expands
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
