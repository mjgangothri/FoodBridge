import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5174,
    proxy: { "/api": "http://localhost:4000" }, // so the portal can call /api without CORS
  },
});
