import React from "react";

interface BreakModeToggleProps {
  isChecked: boolean;
  onToggle: (checked: boolean) => void;
}

const BreakModeToggle: React.FC<BreakModeToggleProps> = ({
  isChecked,
  onToggle,
}) => {
  return (
    <div className="flex items-center space-x-6">
      <div className="flex items-center space-x-2">
        {/* Icon (Pause/Break) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-10 w-10 transition-colors ${
            isChecked ? "text-uber-red-600" : "text-uber-gray-400"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          {/* Simple Pause/Break Icon */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        {/* Label */}
        <span className="text-base font-medium text-uber-gray-900">
          Break mode
        </span>
      </div>

      {/* Toggle Switch */}
      <label
        htmlFor="break-mode-toggle"
        className="relative inline-flex items-center cursor-pointer"
      >
        <input
          type="checkbox"
          id="break-mode-toggle"
          className="sr-only peer"
          checked={isChecked}
          onChange={(e) => onToggle(e.target.checked)}
        />
        {/* Toggle Track and Thumb */}
        <div
          className={`w-11 h-6 rounded-full peer 
            peer-focus:ring-2 peer-focus:ring-blue-300 
            dark:peer-focus:ring-uber-blue-800 
            ${isChecked ? "bg-red-600" : "bg-uber-gray-200"}
            peer-checked:after:translate-x-full 
            peer-checked:after:border-white 
            after:content-[''] 
            after:absolute after:top-0.5 after:left-[2px] 
            after:bg-white after:border-gray-300 after:border 
            after:rounded-full after:h-5 after:w-5 
            after:transition-all 
            dark:border-gray-600
          `}
        ></div>
      </label>
    </div>
  );
};

export default BreakModeToggle;
