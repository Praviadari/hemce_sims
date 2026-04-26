// vite.config.js
import { defineConfig } from "file:///D:/desktop/Web%20Development/hemce-sims/node_modules/vite/dist/node/index.js";
import react from "file:///D:/desktop/Web%20Development/hemce-sims/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///D:/desktop/Web%20Development/hemce-sims/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"]
      },
      manifest: {
        name: "HEMCE-2026 Simulation Hub",
        short_name: "HEMCE-2026",
        description: "Interactive exhibition simulation portal for Thermal Systems Hyderabad Pvt. Ltd. at the 15th HEMCE.",
        theme_color: "#0a192f",
        background_color: "#0a192f",
        display: "standalone"
      }
    })
  ],
  server: {
    host: "0.0.0.0",
    port: 5173
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxkZXNrdG9wXFxcXFdlYiBEZXZlbG9wbWVudFxcXFxoZW1jZS1zaW1zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxkZXNrdG9wXFxcXFdlYiBEZXZlbG9wbWVudFxcXFxoZW1jZS1zaW1zXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9kZXNrdG9wL1dlYiUyMERldmVsb3BtZW50L2hlbWNlLXNpbXMvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1wd2FcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgVml0ZVBXQSh7XG4gICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcbiAgICAgIHdvcmtib3g6IHtcbiAgICAgICAgZ2xvYlBhdHRlcm5zOiBbJyoqLyoue2pzLGNzcyxodG1sLGljbyxwbmcsc3ZnLHdlYnB9J11cbiAgICAgIH0sXG4gICAgICBtYW5pZmVzdDoge1xuICAgICAgICBuYW1lOiAnSEVNQ0UtMjAyNiBTaW11bGF0aW9uIEh1YicsXG4gICAgICAgIHNob3J0X25hbWU6ICdIRU1DRS0yMDI2JyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdJbnRlcmFjdGl2ZSBleGhpYml0aW9uIHNpbXVsYXRpb24gcG9ydGFsIGZvciBUaGVybWFsIFN5c3RlbXMgSHlkZXJhYmFkIFB2dC4gTHRkLiBhdCB0aGUgMTV0aCBIRU1DRS4nLFxuICAgICAgICB0aGVtZV9jb2xvcjogJyMwYTE5MmYnLFxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnIzBhMTkyZicsXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcbiAgICAgIH1cbiAgICB9KVxuICBdLFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcbiAgICBwb3J0OiA1MTczLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTJTLFNBQVMsb0JBQW9CO0FBQ3hVLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFFeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sUUFBUTtBQUFBLE1BQ04sY0FBYztBQUFBLE1BQ2QsU0FBUztBQUFBLFFBQ1AsY0FBYyxDQUFDLHFDQUFxQztBQUFBLE1BQ3REO0FBQUEsTUFDQSxVQUFVO0FBQUEsUUFDUixNQUFNO0FBQUEsUUFDTixZQUFZO0FBQUEsUUFDWixhQUFhO0FBQUEsUUFDYixhQUFhO0FBQUEsUUFDYixrQkFBa0I7QUFBQSxRQUNsQixTQUFTO0FBQUEsTUFDWDtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
