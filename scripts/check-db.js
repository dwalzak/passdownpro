const { Client } = require('pg')

const client = new Client({
  connectionString: 'postgres://postgres:DannyWalzak%405831@db.wvhowhgmveastiqvnbrg.supabase.co:5432/postgres'
})

async function checkDb() {
  await client.connect()
  
  // Check user_profiles table structure
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles'
    ORDER BY ordinal_position;
  `)
  
  console.log("user_profiles columns:")
  res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`))

  await client.end()
}

checkDb().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
