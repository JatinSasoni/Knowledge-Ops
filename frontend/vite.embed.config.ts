import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/*
 * Builds the website widget's iframe app into ONE file with a FIXED name:
 *   public/widget/embed.js
 * The frame page served by the API loads exactly "/widget/embed.js", so the name can't
 * have a content hash like the main app's files. Output goes to public/ so that:
 *   - in dev, Vite serves it straight away (run `npm run dev:widget` alongside `npm run dev`)
 *   - in a build, it's copied into dist/ with everything else in public/
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: false, // don't copy public/ into public/widget/
  define: { "process.env.NODE_ENV": JSON.stringify("production") }, // React's production build
  build: {
    outDir: "public/widget",
    emptyOutDir: true,
    lib: {
      entry: "src/embed/main.tsx",
      formats: ["es"],
      fileName: () => "embed.js",
    },
  },
});
