import dotenv from "dotenv";
import app from "./app";
import { testConnection } from "./config/supabase";

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

async function start() {
  try {
    await testConnection();
    // eslint-disable-next-line no-console
    console.log("[server] Database connection OK");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[server] Failed to connect to database", err);
  }

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] Listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[server] Fatal startup error", err);
  process.exit(1);
});
