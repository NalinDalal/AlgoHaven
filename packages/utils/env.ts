type EnvSchema = Record<string, { required: boolean; default?: string; secret?: boolean }>;

function maskValue(value: string): string {
  if (value.length <= 8) return "****";
  return value.slice(0, 4) + "****" + value.slice(-4);
}

export function validateEnv(schema: EnvSchema, serviceName: string): void {
  const missing: string[] = [];

  for (const [key, config] of Object.entries(schema)) {
    const value = process.env[key] ?? config.default;

    if (config.required && (!value || value === "")) {
      missing.push(key);
    } else if (value) {
      process.env[key] = value;
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[${serviceName}] Missing required environment variables:\n  ${missing.join("\n  ")}\n\nCopy .env.example to .env and fill in the values.`
    );
  }
}
