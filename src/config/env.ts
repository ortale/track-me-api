import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
	PORT: z.coerce.number().int().positive().default(3000),
	CORS_ORIGIN: z.string().default("*"),
	SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
	SUPABASE_PUBLISHABLE_KEY: z
		.string()
		.min(1, "SUPABASE_PUBLISHABLE_KEY is required"),
});

export const env = envSchema.parse(process.env);
