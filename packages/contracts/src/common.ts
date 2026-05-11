import { z } from "zod";

export const idSchema = z.string().min(1);
export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const macroTotalsSchema = z.object({
  calories: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  fiberG: z.number().nonnegative().optional(),
  sugarG: z.number().nonnegative().optional(),
  sodiumMg: z.number().nonnegative().optional(),
});

export const portionUnitSchema = z.enum([
  "gram",
  "ml",
  "piece",
  "serving",
  "bowl",
  "katori",
  "cup",
  "tablespoon",
  "teaspoon",
  "ladle",
  "roti",
  "idli",
  "dosa",
  "slice",
  "scoop",
  "small",
  "medium",
  "large",
]);

export type MacroTotalsContract = z.infer<typeof macroTotalsSchema>;
export type PortionUnitContract = z.infer<typeof portionUnitSchema>;
