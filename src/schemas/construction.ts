import { z, ZodErrorMap, ZodIssueCode, ZodParsedType } from "zod";

const contractedAtErrorMap: ZodErrorMap = (issue, ctx) => {
  if (
    issue.code === ZodIssueCode.invalid_type &&
    issue.received === ZodParsedType.undefined
  )
    return { message: "契約日を入力してください" };
  if (issue.code === ZodIssueCode.invalid_date)
    return { message: "契約日を入力してください" };
  return { message: ctx.defaultError };
};

const periodErrorMap: ZodErrorMap = (issue, ctx) => {
  if (
    issue.code === ZodIssueCode.invalid_type &&
    issue.received === ZodParsedType.undefined
  )
    return { message: "完成期日を入力してください" };
  if (issue.code === ZodIssueCode.invalid_date)
    return { message: "完成期日を入力してください" };
  return { message: ctx.defaultError };
};

export const createConstructionSchema = z.object({
  name: z.string().nonempty({ message: "工事名称を入力してください" }),
  address: z.string().nonempty({ message: "住所を入力してください" }),
  contractedAt: z.date({ errorMap: contractedAtErrorMap }),
  period: z.date({ errorMap: periodErrorMap }),
  contractAmount: z
    .number({
      invalid_type_error: "請負金額を入力してください",
    })
    .nonnegative({ message: "請負金額は0以上の数を入力してください" }),
  advancePaymentRate: z
    .number({
      invalid_type_error: "前払い金額率を入力してください",
    })
    .nonnegative({ message: "前払い金額率は0以上の数を入力してください" }),
});

export type CreateConstructionSchema = z.infer<typeof createConstructionSchema>;

export const updateConstructionSchema = z.object({
  name: z.string().nonempty({ message: "工事名称を入力してください" }),
});

export type UpdateConstructionSchema = z.infer<typeof updateConstructionSchema>;
