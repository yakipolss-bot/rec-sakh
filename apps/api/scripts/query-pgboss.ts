require('dotenv').config();
(async () => {
  try {
    const { Client } = await import('pg');
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('DATABASE_URL not set');
      process.exit(1);
    }
    const client = new Client({ connectionString });
    await client.connect();
    const res = await client.query(
      `SELECT id, name, state, attempts, priority, next_retry_at, created_at, data->>'article' as article
       FROM pgboss.job
       ORDER BY created_at DESC
       LIMIT 20`
    );
    console.log('pgboss.job rows:', res.rowCount);
    console.dir(res.rows, { depth: 2 });
    await client.end();
  } catch (e) {
    console.error('query-pgboss error', e);
    process.exitCode = 2;
  } finally {
    process.exit();
  }
})();
