import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}']
      },
      manifest: {
        name: 'HEMCE-2026 Simulation Hub',
        short_name: 'HEMCE-2026',
        description: 'Interactive exhibition simulation portal for Thermal Systems Hyderabad Pvt. Ltd. at the 15th HEMCE.',
        theme_color: '#0a192f',
        background_color: '#0a192f',
        display: 'standalone',
      }
    })
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
