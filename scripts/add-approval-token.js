const { Client } = require('pg')

const client = new Client({
  connectionString: 'postgres://postgres:DannyWalzak%405831@db.wvhowhgmveastiqvnbrg.supabase.co:5432/postgres'
})

async function main() {
  await client.connect()

  // Add approval_token column to user_profiles for secure email links
  await client.query(`
    alter table public.user_profiles
      add column if not exists approval_token text unique;
  `)
  console.log('✅ Added approval_token column to user_profiles')

  await client.end()
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
