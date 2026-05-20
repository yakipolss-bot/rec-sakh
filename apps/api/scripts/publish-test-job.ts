require('dotenv').config();
(async () => {
  const imported = await import('pg-boss');
  const _pgBossPkg = imported as any;
  // prefer named `PgBoss` export, then default, then whole package
  const PgBossCtor = _pgBossPkg && (_pgBossPkg.PgBoss ?? _pgBossPkg.default ?? _pgBossPkg);
  console.log('pg-boss module keys:', Object.keys(_pgBossPkg));
  console.log('pg-boss default present:', !!_pgBossPkg.default, 'typeof default:', typeof _pgBossPkg.default);

  
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  if (typeof PgBossCtor !== 'function') {
    console.error('pg-boss export is not constructable in this environment (after dynamic import)');
    process.exit(2);
  }

  const boss = new PgBossCtor({ connectionString });
  try {
    await boss.start();
    console.log('Publisher: PgBoss started');
    const jobId = await boss.publish('typesense:indexNews', {
      article: {
        id: `test-job-${Date.now()}`,
        title: 'Test Article from publish-test-job',
        content: 'This is a test job published by script.',
        slug: 'test-job',
      },
    });
    console.log('Publisher: published job id=', jobId);
    // give boss a moment to flush
    await new Promise((r) => setTimeout(r, 500));
  } catch (e) {
    console.error('Publisher error', e);
    process.exitCode = 2;
  } finally {
    try { await boss.stop(); } catch { /* noop */ }
    process.exit();
  }
})();
