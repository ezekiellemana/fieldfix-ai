export function sqlText(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export function sqlNullableText(
  value: string | null | undefined
): string {
  return value == null ? "NULL" : sqlText(value);
}

export function sqlJson(value: unknown): string {
  const json = JSON.stringify(value).replaceAll("'", "''");

  return `'${json}'::JSONB`;
}

export function sqlNullableNumber(
  value: number | null | undefined
): string {
  if (value == null) {
    return "NULL";
  }

  if (!Number.isFinite(value)) {
    throw new Error("SQL numeric value must be finite.");
  }

  return String(value);
}
