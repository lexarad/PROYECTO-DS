import { PrismaClient } from '@prisma/client';
async function test(url, name) {
  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    const r = await p.$queryRaw`SELECT 1 as ok`;
    console.log(name, 'OK');
    await p.$disconnect();
    return true;
  } catch (e) {
    console.log(name, 'FAIL:', (e.message || String(e)).slice(0, 220).replace(/\n/g,' | '));
    try { await p.$disconnect(); } catch {}
    return false;
  }
}
// Try with the old password against the CORRECT host (aws-1-eu-west-2)
await test('postgresql://postgres.smtyrwuxbyqdwjdjewci:W8%23Zb8_PbgXJFzm@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true', 'new-correct-host');
