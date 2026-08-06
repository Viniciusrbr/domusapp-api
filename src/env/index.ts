import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z.enum(["dev", "test", "production"]).default("dev"),
	JWT_SECRET: z.string(),
	PORT: z.coerce.number().default(8000),
	API_BASE_URL: z.url().default("http://localhost:8000"),
	// Base do app cliente — usada para montar o link de reset de senha (RF03).
	WEB_APP_URL: z.url().default("http://localhost:3000"),
	DATABASE_URL: z.url(),
	CORS_ORIGINS: z
		.string()
		.default("http://localhost:3000")
		.transform((value) =>
			value
				.split(",")
				.map((origin) => origin.trim())
				.filter(Boolean),
		)
		.pipe(z.array(z.url()).min(1)),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
	console.error("Invalid environment variables", z.treeifyError(_env.error));

	throw new Error("Invalid environment variables.");
}

export const env = _env.data;
