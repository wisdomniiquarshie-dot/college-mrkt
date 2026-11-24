export function isMissingContactVisibilityColumn(error: unknown) {
  if (typeof error !== "object" || error === null) return false;

  const { code, message, details, hint } = error as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };
  const description = [message, details, hint].filter(Boolean).join(" ").toLowerCase();

  return (
    (code === "42703" || code === "PGRST204")
    && description.includes("is_contact_public")
  ) || (
    description.includes("is_contact_public")
    && (description.includes("does not exist") || description.includes("schema cache"))
  );
}

export function isMissingSupabaseTable(error: unknown, tableName: string) {
  if (typeof error !== "object" || error === null) return false;

  const { code, message, details, hint } = error as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };
  const description = [message, details, hint].filter(Boolean).join(" ").toLowerCase();
  const normalizedTableName = tableName.toLowerCase();

  return (
    (code === "42P01" || code === "PGRST205")
    && description.includes(normalizedTableName)
  ) || (
    description.includes(normalizedTableName)
    && (description.includes("does not exist") || description.includes("schema cache") || description.includes("could not find"))
  );
}

export function isMissingListingColumn(error: unknown, columnName: string) {
  if (typeof error !== "object" || error === null) return false;

  const { code, message, details, hint } = error as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };
  const description = [message, details, hint].filter(Boolean).join(" ").toLowerCase();
  const normalizedColumnName = columnName.toLowerCase();

  return (
    (code === "42703" || code === "PGRST204")
    && description.includes(normalizedColumnName)
  ) || (
    description.includes(normalizedColumnName)
    && (description.includes("does not exist") || description.includes("schema cache"))
  );
}
