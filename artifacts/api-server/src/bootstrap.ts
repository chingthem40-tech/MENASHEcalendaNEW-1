import { runMigrations } from "./migrate";
import { logger } from "./lib/logger";

runMigrations()
  .then(() => {
    logger.info("Development database bootstrap complete");
  })
  .catch((error) => {
    logger.error({ error }, "Development database bootstrap failed");
    process.exitCode = 1;
  });
