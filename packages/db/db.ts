import { ZenStackClient } from "@zenstackhq/orm";
import { PostgresDialect } from "@zenstackhq/orm/dialects/postgres";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { schema } from "./generated/zenstack/schema";
import type { SchemaType } from "./generated/zenstack/schema";
import type { ClientContract } from "@zenstackhq/orm";

const currentDir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(currentDir, "../../.env") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required to initialize ZenStack client");
}

const pool = new Pool({ connectionString: databaseUrl });

export const db = new ZenStackClient(schema, {
	dialect: new PostgresDialect({ pool }),
});

export type DbClient = ClientContract<SchemaType>;

export async function closeDb() {
	await pool.end();
}
