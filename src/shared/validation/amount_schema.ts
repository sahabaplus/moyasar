import { z } from "zod";

export const amountSchema = z.number().int().positive().min(1);
