import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type { FrequencyUnit } from "@/generated/client/enums";

dayjs.extend(utc);

/**
 * Motor de recorrência (RN05–RN07).
 *
 * Tudo aqui é DATA DE CALENDÁRIO, sem hora e sem fuso: as datas da grade
 * (`startDate`/`nextDueDate`) são `@db.Date` e chegam como meia-noite UTC.
 * Toda a aritmética roda em UTC justamente para não reintroduzir off-by-one
 * por conversão de timezone. O status derivado (agendada / em dia / vence hoje
 * / vencida) é responsabilidade do cliente, no fuso de quem visualiza.
 */

const DAYJS_UNIT_BY_FREQUENCY_UNIT = {
	DAY: "day",
	WEEK: "week",
	MONTH: "month",
} as const;

interface ComputeNextDueDateParams {
	current: Date;
	frequency: number;
	unit: FrequencyUnit;
}

/**
 * Avança EXATAMENTE um intervalo a partir da data prevista informada —
 * nunca a partir da data real de conclusão (RN06/RN07). Se o resultado ainda
 * estiver no passado, a tarefa segue vencida e o usuário conclui de novo.
 *
 * Em `MONTH`, o dia é limitado ao último dia do mês de destino
 * (31/jan + 1 mês = 28 ou 29/fev), comportamento nativo do dayjs.
 */
export const computeNextDueDate = ({
	current,
	frequency,
	unit,
}: ComputeNextDueDateParams): Date =>
	dayjs
		.utc(current)
		.startOf("day")
		.add(frequency, DAYJS_UNIT_BY_FREQUENCY_UNIT[unit])
		.toDate();

/** Converte "YYYY-MM-DD" na data de calendário correspondente (meia-noite UTC). */
export const parseDateOnly = (date: string): Date =>
	dayjs.utc(date).startOf("day").toDate();

/** Serializa uma data de calendário como "YYYY-MM-DD", sem aplicar fuso. */
export const formatDateOnly = (date: Date): string =>
	dayjs.utc(date).format("YYYY-MM-DD");
