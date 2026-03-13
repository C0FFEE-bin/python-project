import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(repoRoot, "frontend");

export default defineConfig({
    root: frontendRoot,
    plugins: [react()],
    server: {
        host: "127.0.0.1",
        port: 5173,
        strictPort: true,
        fs: {
            allow: [repoRoot],
        },
    },
    build: {
        manifest: true,
        outDir: path.resolve(repoRoot, "webapp/main/static/main/frontend"),
        emptyOutDir: true,
        rollupOptions: {
            input: {
                home: path.resolve(frontendRoot, "src/home/main.jsx"),
            },
        },
    },
});
