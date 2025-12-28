import express from "express";
import cors from "cors";
import morgan from "morgan";

import router from "./routes";
import { errorHandler, notFound } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);

export default app;
