import { ClockAlert } from "lucide-react";
import React from "react";

interface RestAlertModalProps {
  onTakeBreak: () => void;
  onDriveOn: () => void;
  isOpen: boolean;
}

const RestAlertModal: React.FC<RestAlertModalProps> = ({
  isOpen,
  onTakeBreak,
  onDriveOn,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 bg-opacity-75 p-4">
      <div
        className="
          bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 sm:p-8 
          transform transition-all duration-300 ease-out scale-100
        "
        style={{ backgroundColor: "var(--color-uber-white)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex justify-center mb-4">
          <ClockAlert
            className="w-14 h-14 text-amber-500"
            style={{ color: "#FFC043" }}
          />
        </div>

        <h2
          id="modal-title"
          className="text-xl font-bold mb-2 text-center"
          style={{ color: "var(--color-uber-black)" }}
        >
          Time for a Mandatory Break
        </h2>

        <p
          className="text-base text-center mb-6"
          style={{ color: "var(--color-uber-gray-700)" }}
        >
          You've been driving{" "}
          <span className="font-bold">continuously for over 3 hours</span>. For
          your safety and to comply with guidelines, please take a{" "}
          <span className="font-bold">20-minute rest</span> now.
        </p>

        <div className="space-y-3">
          <button
            onClick={onTakeBreak}
            className="
              cursor-pointer w-full py-4 rounded-lg font-semibold text-lg transition-colors duration-200
              hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2
            "
            style={{
              backgroundColor: "var(--color-uber-black)",
              color: "var(--color-uber-white)",
              boxShadow: "0 0 0 2px var(--color-uber-black)",
            }}
          >
            I'm Taking a Break Now
          </button>

          <button
            onClick={onDriveOn}
            className="
              cursor-pointer w-full py-4 text-center font-medium transition-colors duration-200
              hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2
            "
            style={{
              color: "var(--color-uber-gray-700)",
              boxShadow: "0 0 0 2px var(--color-uber-gray-400)",
            }}
          >
            I'll Stop Driving Soon
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestAlertModal;
