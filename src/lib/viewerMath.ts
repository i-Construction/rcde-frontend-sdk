/** 値を [min, max] の範囲に丸める。 */
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
