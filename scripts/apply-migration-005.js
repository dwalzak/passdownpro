const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const client = new Client({
  connectionString: 'postgres://postgres:DannyWalzak%405831@db.wvhowhgmveastiqvnbrg.supabase.co:5432/postgres'
})

async function main() {
  await client.connect()
  console.log('Connected to Supabase...')

  const sql = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/005_approval_and_audit.sql'),
    'utf8'
  )

  await client.query(sql)
  console.log('✅ Migration 005_approval_and_audit applied successfully!')
  await client.end()
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
