import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black text-white overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 via-black to-gray-900 opacity-90" />

      {/* Uber-style pulsing ring */}
      <motion.div
        className="w-24 h-24 border-4 border-gray-700 rounded-full flex items-center justify-center relative z-10"
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(255,255,255,0.2)",
            "0 0 0 20px rgba(255,255,255,0)",
          ],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "loop",
        }}
      >
        <div className="w-10 h-10 bg-white rounded-full animate-pulse" />
      </motion.div>

      {/* Loading text */}
      <motion.h1
        className="mt-8 text-xl font-semibold tracking-wide text-gray-200 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.8, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Loading...
      </motion.h1>

      {/* Subtle bottom shimmer line */}
      <motion.div
        className="absolute bottom-8 w-32 h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent rounded-full"
        animate={{ x: ["-50%", "50%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
