import { createHash, randomBytes } from "node:crypto";

// Token opaco enviado ao usuário; apenas o hash é persistido (RNF07/RNF08).
export const generateToken = () => randomBytes(32).toString("hex");

// SHA-256 (determinístico) em vez de bcrypt: o lookup é feito PELO hash, então
// ele precisa ser reproduzível. O token tem 256 bits de entropia, o que torna
// desnecessário o custo de um KDF lento aqui.
export const hashToken = (token: string) =>
	createHash("sha256").update(token).digest("hex");
