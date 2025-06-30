import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/", // ← important: reset base to root for Vercel
  plugins: [react()],
});
