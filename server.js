import express, { json } from "express";
import cors from "cors";

const start = async () => {
  const app = express();
  app.use(
    cors({
      origin: "*",
    })
  );

  app.enable("trust proxy");
  app.use(json({ limit: "1024kb" }));
  app.use(httpContext.middleware);

  app.all("/", (_req, res) => res.status(200).send("LycheeAPI"));
  app.all("/healthcheck", (_req, res) => res.status(200).send("Healthy"));

  router(app);

  try {
    await mongoose.connect(process.env.MONGO_URL, {
      autoCreate: true,
    });
    await startMigration(mongoose.connection);
  } catch (err) {
    throw new Error(err);
  }

  const connection = mongoose.connection;

  connection.once("open", async () => {
    logger.info("MongoDB database connection established successfully");
  });

  const port = parseInt(process.env.PORT);

  app.listen(port, () => {
    logger.info(`Server started at http://localhost:${port}`);
  });

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception: ", err);
  });
};

start();
