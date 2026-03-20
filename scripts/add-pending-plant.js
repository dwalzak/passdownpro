const { Client } = require('pg')

const client = new Client({
  connectionString: 'postgres://postgres:DannyWalzak%405831@db.wvhowhgmveastiqvnbrg.supabase.co:5432/postgres'
})

async function main() {
  await client.connect()
  await client.query(`
    alter table public.user_profiles
      add column if not exists pending_plant_id uuid references public.plants(id) on delete set null;
  `)
  console.log('✅ Added pending_plant_id column')
  await client.end()
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
