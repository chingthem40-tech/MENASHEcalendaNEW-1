import app from "./app";
import { logger } from "./lib/logger";
import { runMigrations } from "./migrate";
import { startPushScheduler, startExpoScheduler, startHolidayWebPushScheduler, startYahrzeitPushScheduler, startHolidayHourReminderScheduler, startWeeklyYahrzeitDigestScheduler } from "./routes/push";

const rawPort = process.env["PORT"] ?? "8080";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  try {
    await runMigrations();
  } catch (err) {
    logger.error({ err }, "Migration failed — aborting startup");
    process.exit(1);
  }

  startPushScheduler();
  startExpoScheduler();
  startHolidayWebPushScheduler();
  startHolidayHourReminderScheduler();
  startYahrzeitPushScheduler();
  startWeeklyYahrzeitDigestScheduler();

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

start();
