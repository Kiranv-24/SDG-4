import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['react-pdf'],
  },
  build: {
    commonjsOptions: {
      include: [/react-pdf/, /node_modules/],
    },
  },
})
