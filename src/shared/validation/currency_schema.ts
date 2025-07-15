import { z } from "zod";
import { Currency, type CurrencyType } from "@types";

export const currencySchema = z
  .enum(Currency)
  .transform(val => val.toUpperCase() as CurrencyType);
