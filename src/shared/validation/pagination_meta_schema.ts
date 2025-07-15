import { z } from "zod";
import type { AllKeys, PaginationMeta } from "@types";

export const paginationMetaSchema = z.object({
  current_page: z.number(),
  next_page: z.number().nullable(),
  prev_page: z.number().nullable(),
  total_pages: z.number(),
  total_count: z.number(),
} satisfies AllKeys<PaginationMeta>);
