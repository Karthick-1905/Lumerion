import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/drizzle',
  schema: './src/drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    prefix: "timestamp",
    table: "__drizzle_migrations__",
    schema: "public",
  },
  verbose:true
});
