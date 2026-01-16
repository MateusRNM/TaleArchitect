import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(async () => ({
  plugins: [
    sveltekit(),
    tailwindcss(),
  ],
  clearScreen: false,
  server: {
    port: 5173,      
    strictPort: true, 
    host: true,    
  },
}));
