import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastifySwagger from "@fastify/swagger";
import fastifyApiReference from "@scalar/fastify-api-reference";
import fastify, { type FastifyError } from "fastify";
import {
	hasZodFastifySchemaValidationErrors,
	isResponseSerializationError,
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
	type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { categoriesRoutes } from "./controllers/categories/routes";
import { householdsRoutes } from "./controllers/households/routes";
import { tasksRoutes } from "./controllers/tasks/routes";
import { usersRoutes } from "./controllers/users/routes";
import { env } from "./env";

export const app = fastify();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifyCors, {
	origin: env.CORS_ORIGINS,
	credentials: true,
});

app.register(fastifyJwt, {
	secret: env.JWT_SECRET,
	cookie: {
		cookieName: "refreshToken",
		signed: false,
	},
	sign: {
		expiresIn: "10m",
	},
});

app.register(fastifyCookie);

await app.register(fastifySwagger, {
	openapi: {
		info: {
			title: "Domus API",
			description: "API for the Domus application.",
			version: "1.0.0",
		},
		servers: [
			{
				description: "API Base URL",
				url: env.API_BASE_URL,
			},
		],
	},
	transform: jsonSchemaTransform,
});

app.register(fastifyApiReference, {
	routePrefix: "/docs",
	configuration: {
		sources: [
			{
				title: "Domus API",
				slug: "domus-api",
				url: "/swagger.json",
			},
		],
	},
});

app.register(usersRoutes);
app.register(householdsRoutes);
app.register(categoriesRoutes);
app.register(tasksRoutes);

app.withTypeProvider<ZodTypeProvider>().route({
	method: "GET",
	url: "/swagger.json",
	schema: {
		hide: true,
	},
	handler: async () => {
		return app.swagger();
	},
});

app.setErrorHandler((error: FastifyError, _, reply) => {
	// Request validation errors (body/params/querystring) -> 400
	if (hasZodFastifySchemaValidationErrors(error)) {
		return reply.status(400).send({
			message: "Validation error.",
			issues: error.validation,
		});
	}

	// The response we produced does not match its own schema -> our bug, 500
	if (isResponseSerializationError(error)) {
		if (env.NODE_ENV !== "production") {
			console.error(
				`Response validation error on ${error.method} ${error.url}:`,
				error.cause.issues,
			);
		}
		return reply.status(500).send({
			message: "Internal server error.",
		});
	}

	// Errors that already carry a client-side HTTP status -> respect it
	if (typeof error.statusCode === "number" && error.statusCode < 500) {
		return reply.status(error.statusCode).send({
			message: error.message,
		});
	}

	if (env.NODE_ENV !== "production") {
		console.error(error);
	} else {
		// TODO: Log error to an external service like Sentry, LogRocket, etc.
	}

	return reply.status(500).send({
		message: "Internal server error.",
	});
});
