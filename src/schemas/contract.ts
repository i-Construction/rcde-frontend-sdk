import { ZodErrorMap, ZodIssueCode, ZodParsedType, z } from 'zod';

const dateErrorMap: ZodErrorMap = (issue, ctx) => {
  if (
    issue.code === ZodIssueCode.invalid_type &&
    issue.received === ZodParsedType.undefined
  )
    return { message: '契約日を入力してください' };
  if (issue.code === ZodIssueCode.invalid_date)
    return { message: '契約日を入力してください' };
  return { message: ctx.defaultError };
};

export const createContractSchema = z.object({
  name: z.string().nonempty({ message: '契約項目名を入力してください' }),
  contractedAt: z.date({ errorMap: dateErrorMap }),
  email: z
    .string()
    .email({ message: '管理者メールアドレスを入力してください' }),
  unitPrice: z
    .number({ invalid_type_error: '契約単価を入力してください' })
    .nonnegative({ message: '契約単価は0以上の数字を入力してください' }),
  unitVolume: z
    .number({ invalid_type_error: '契約数量を入力してください' })
    .nonnegative({ message: '契約数量は0以上の数字を入力してください' }),
});

export type CreateContractSchema = z.infer<typeof createContractSchema>;

export const updateContractSchema = z.object({
  name: z.string().nonempty({ message: '契約項目名を入力してください' }),
});

export type UpdateContractSchema = z.infer<typeof updateContractSchema>;
