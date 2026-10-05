import "dotenv/config";

import cors from "cors";
import express from "express";

import { env } from "./config/env";
import healthRoutes from "./routes/health.routes";
import profileRoutes from "./routes/profile.routes";
import journeyRoutes from "./routes/journey.routes";

const app = express();

app.disable("x-powered-by");

app.use(
	cors({
		origin:
			env.CORS_ORIGIN === "*"
				? "*"
				: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
	}),
);

app.use(express.json({ limit: "1mb" }));

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/journeys", journeyRoutes);

app.use((_req, res) => {
	res.status(404).json({
		message: "Route not found",
	});
});

const server = app.listen(env.PORT, () => {
	console.log(`Track Me API running on port ${env.PORT}`);
});

const shutdown = async (signal: string) => {
	console.log(`${signal} received. Shutting down...`);

	server.close(async () => {
		process.exit(0);
	});
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

export { app };
