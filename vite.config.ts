import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const ntaApiKey = env.NTA_API_KEY ?? "";

  return {
    base: env.VITE_BASE_PATH ?? "/",
    plugins: [react()],
    server: {
      proxy: {
        "/api/tfi": {
          target: "https://api.nationaltransport.ie/gtfsr/v2",
          changeOrigin: true,
          secure: true,
          rewrite: (proxyPath) => proxyPath.replace(/^\/api\/tfi/, ""),
          headers: {
            "x-api-key": ntaApiKey,
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src"),
      },
    },
  };
});
