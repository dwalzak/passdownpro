import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@supabase/ssr'
import { Stripe } from 'stripe'

// Service role uses admin key for bypassing RLS
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    cookies: {
      getAll() { return [] },
      setAll() { }
    }
  }
)

/**
 * Handle Stripe Webhooks
 */
export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error(`❌ Webhook Error: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Idempotency: log the event first
  const { error: logError } = await supabase
    .from('stripe_events')
    .insert({
      id: event.id,
      type: event.type,
      payload: event as any,
    })

  if (logError && logError.code !== '23505') { // Ignore unique constraint (if event already exists)
    console.error(`❌ Webhook Error Logging Event: ${logError.message}`)
    return NextResponse.json({ error: `Logging Error: ${logError.message}` }, { status: 500 })
  }

  // Route event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription
      const plantId = subscription.metadata.plant_id || (subscription as any).customer_metadata?.plant_id

      if (!plantId) {
        console.warn(`⚠️ Subscription hook without plant_id: ${subscription.id}`)
        // Could also fetch customer to find the plant_id
        break
      }

      // Map Stripe status to our app's status
      let status = 'active'
      if (['past_due', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
        status = 'past_due'
      } else if (subscription.status === 'canceled') {
        status = 'canceled'
      }

      // Map price to tier (assuming we know tiers)
      // NOTE: This usually needs the price_id -> tier mapping from environment or DB.
      // For now, we'll try to find the tier from the product metadata or price.
      let tier = 'free'
      const priceId = subscription.items.data[0].price.id
      
      // Assuming user has set these up in env or DB. Let's placeholders for now.
      if (priceId === process.env.STRIPE_PRO_PRICE_ID) tier = 'pro'
      if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) tier = 'enterprise'
      
      // Update the plant's tier and status
      const { error: updateError } = await supabase
        .from('plants')
        .update({
          subscription_tier: tier,
          subscription_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', plantId)

      if (updateError) {
        console.error(`❌ Webhook Error Updating Plant: ${updateError.message}`)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
      break

    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
