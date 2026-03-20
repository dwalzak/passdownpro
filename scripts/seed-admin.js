const { Client } = require('pg')

const client = new Client({
  connectionString: 'postgres://postgres:DannyWalzak%405831@db.wvhowhgmveastiqvnbrg.supabase.co:5432/postgres'
})

async function main() {
  await client.connect()
  const userId = '68bd2fd5-4e6e-4d77-a2bf-6aecbf33b5be'

  // Create the plant
  const plantRes = await client.query(
    `INSERT INTO public.plants (name, subscription_tier, subscription_status) 
     VALUES ('PassdownPro HQ', 'enterprise', 'active') 
     RETURNING id, name`,
    []
  )
  const plantId = plantRes.rows[0].id
  console.log('✅ Plant created:', plantRes.rows[0])

  // Create / upsert admin profile
  const profileRes = await client.query(
    `INSERT INTO public.user_profiles (id, plant_id, full_name, role) 
     VALUES ($1, $2, 'Daniel Walzak', 'admin') 
     ON CONFLICT (id) DO UPDATE SET plant_id = $2, role = 'admin', full_name = 'Daniel Walzak' 
     RETURNING *`,
    [userId, plantId]
  )
  console.log('✅ Admin profile:', profileRes.rows[0])

  await client.end()
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
