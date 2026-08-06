export interface SendPasswordResetParams {
	to: string;
	link: string;
}

// Contrato de envio de e-mail. Os use cases dependem SOMENTE desta interface —
// nunca de um provedor concreto.
export interface Mailer {
	sendPasswordReset(params: SendPasswordResetParams): Promise<void>;
}
