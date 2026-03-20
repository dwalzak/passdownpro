'use server'

import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

/**
 * Create a Stripe checkout session for a subscription upgrade.
 */
export async function createCheckoutSession(priceId: string, plantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Get plant details (for name/customer_id)
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('name, stripe_customer_id')
    .eq('id', plantId)
    .single() as any

  if (plantError || !plant) {
    throw new Error('Plant not found')
  }

  // Create or retrieve Stripe customer if not already exists
  let customerId = plant.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: plant.name,
      email: user.email,
      metadata: { plant_id: plantId },
    })
    customerId = customer.id

    // Store the customer ID
    await (supabase
      .from('plants')
      .update({ stripe_customer_id: customerId } as any)
      .eq('id', plantId) as any)
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    subscription_data: {
      metadata: { plant_id: plantId },
    },
  })

  if (!session.url) {
    throw new Error('Failed to create checkout session url')
  }

  redirect(session.url)
}

/**
 * Create a Stripe billing portal session so users can manage their subscription.
 */
export async function createPortalSession(plantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('stripe_customer_id')
    .eq('id', plantId)
    .single() as any

  if (plantError || !plant?.stripe_customer_id) {
    throw new Error('Stripe customer not found for this plant')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: plant.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
  })

  redirect(session.url)
}
