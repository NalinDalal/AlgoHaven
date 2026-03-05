/**
 * Re-export the database client used across the backend.
 *
 * Centralizing the import makes it easier to mock or swap the client in tests.
 */
export { db } from "@/packages/db/db";
