// RN24: senha com no mínimo 8 caracteres, ao menos uma letra e ao menos um número.
// Fonte única da regra, compartilhada entre os schemas Zod (borda HTTP) e os
// use cases (regra de domínio, verificada mesmo fora do ciclo de request).

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_LETTER_REGEX = /[a-zA-Z]/;
export const PASSWORD_NUMBER_REGEX = /[0-9]/;

export const isStrongPassword = (password: string) =>
	password.length >= PASSWORD_MIN_LENGTH &&
	PASSWORD_LETTER_REGEX.test(password) &&
	PASSWORD_NUMBER_REGEX.test(password);
