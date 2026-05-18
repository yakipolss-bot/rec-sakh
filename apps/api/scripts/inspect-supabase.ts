import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config({ path: './.env' });

async function main() {
  const conn = process.env.SHADOW_DATABASE_URL;
  if (!conn) {
    console.error('SHADOW_DATABASE_URL not set in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    const res = await client.query(
      `SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;`
    );

    console.log('Tables in public schema:');
    const tableNames = res.rows.map((r) => r.table_name as string);
    for (const name of tableNames) {
      console.log('-', name);
    }

    const sample = tableNames.slice(0, 8);
    for (const t of sample) {
      try {
        const c = await client.query(`SELECT COUNT(*)::text as cnt FROM "${t}"`);
        console.log(`  ${t}: ${c.rows[0].cnt}`);
      } catch (e) {
        console.log(`  ${t}: (count error) ${(e as Error).message}`);
      }
    }

    console.log('✅ Supabase inspection complete.');
  } catch (err) {
    console.error('Connection/query error:', (err as Error).message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
