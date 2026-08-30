import app from "./app";
import { logger } from "./lib/logger";
import { config, printConfigSummary } from "./lib/config";
import {
  startPushScheduler,
  startExpoScheduler,
  startHolidayWebPushScheduler,
  startYahrzeitPushScheduler,
  startHolidayHourReminderScheduler,
  startWeeklyYahrzeitDigestScheduler,
} from "./routes/push";
import { startAnnouncementScheduler } from "./routes/announcements";

function start() {
  logger.info(
    { environment: config.nodeEnv },
    config.nodeEnv === "production"
      ? "Production startup"
      : "Application startup — run pnpm db:bootstrap separately when schema changes are needed",
  );

  // Print a configuration summary so operators can confirm readiness at a
  // glance without exposing any secret values in logs.
  printConfigSummary();

  startPushScheduler();
  startExpoScheduler();
  startHolidayWebPushScheduler();
  startHolidayHourReminderScheduler();
  startYahrzeitPushScheduler();
  startWeeklyYahrzeitDigestScheduler();
  startAnnouncementScheduler();

  // Explicitly bind to 0.0.0.0 so the server accepts connections on all
  // network interfaces — required on Railway, Render, and Fly.io.
  const server = app.listen(config.port, "0.0.0.0", () => {
    logger.info({ port: config.port }, "Server listening");
  });

  server.on("error", (err) => {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  });
}

start();
