import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/habit-tracker/",
  build: { sourcemap: false },
  plugins: [react()],
});

