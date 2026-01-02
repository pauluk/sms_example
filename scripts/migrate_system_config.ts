import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
    console.log('Running migration: Creating system_config table...');
    try {
        // Create Table
        await sql`
      CREATE TABLE IF NOT EXISTS "system_config" (
        "key" text PRIMARY KEY NOT NULL,
        "value" text NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `;

        // Seed Default Value
        await sql`
      INSERT INTO "system_config" ("key", "value")
      VALUES ('allowed_domains', 'nhsbsa.nhs.uk')
      ON CONFLICT ("key") DO NOTHING;
    `;

        console.log('Migration complete: system_config table created and seeded.');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

main();
