
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL || "postgresql://mock_owner:mock_password@ep-mock-123456.us-east-2.aws.neon.tech/mock_db?sslmode=require");
export const db = drizzle(sql, { schema });
