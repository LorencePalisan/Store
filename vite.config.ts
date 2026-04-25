import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import crypto from "node:crypto";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load ALL .env vars (no prefix filter) so IMAGEKIT_PRIVATE_KEY is available
  const env = loadEnv(mode, process.cwd(), "");

  function imagekitAuthPlugin(): Plugin {
    return {
      name: "imagekit-auth",
      configureServer(server) {
        server.middlewares.use("/api/imagekit-auth", (_req, res) => {
          const privateKey = env.IMAGEKIT_PRIVATE_KEY ?? "";
          const token = crypto.randomUUID();
          const expire = Math.floor(Date.now() / 1000) + 2400;
          const signature = crypto
            .createHmac("sha1", privateKey)
            .update(token + String(expire))
            .digest("hex");
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ token, expire, signature }));
        });
      },
    };
  }

  return {
    plugins: [react(), tailwindcss(), imagekitAuthPlugin()],
  };
});
