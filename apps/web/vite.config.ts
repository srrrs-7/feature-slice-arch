import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 3000,
    host: true,
  },
  resolve: {
    alias: {
      "@": "/src",
      "@api": "/workspace/main/apps/api/src",
      $lib: "/src/lib",
    },
  },
});
