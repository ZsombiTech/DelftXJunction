import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "uberlogo.png"], // your icons
      manifest: {
        name: "Uber Auto",
        short_name: "Uber Auto",
        description: "Your money earning assistant",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/uberlogo.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/uberlogo.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MiB
      },
    }),
  ],
});
