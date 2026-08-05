import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z.enum(["dev", "test", "production"]).default("dev"),
	JWT_SECRET: z.string(),
	PORT: z.coerce.number().default(8000),
	API_BASE_URL: z.url().default("http://localhost:8000"),
	DATABASE_URL: z.url(),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
	console.error("Invalid environment variables", z.treeifyError(_env.error));

	throw new Error("Invalid environment variables.");
}

export const env = _env.data;
