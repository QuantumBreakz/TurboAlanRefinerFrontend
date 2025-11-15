import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

let supabase: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("@/lib/supabase")
  supabase = mod.supabase
} catch {}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2022-11-15' })
  let event: Stripe.Event
  try {
    const buf = Buffer.from(await request.arrayBuffer())
    event = stripe.webhooks.constructEvent(buf, sig, secret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const customerId = session.customer as string | null
      const customerEmail = session.customer_details?.email || session.customer_email || null
      const subscriptionId = session.subscription as string | null
      const plan = session.metadata?.plan || null
      const metaUserId = (session.metadata?.userId as string | undefined) || null

      if (supabase && (customerId || customerEmail)) {
        // Try to resolve user_id by metadata first, then email
        let resolvedUserId: string | null = null
        try {
          if (metaUserId) {
            resolvedUserId = metaUserId
          } else if (customerEmail) {
            const { data } = await supabase.from('users').select('id').eq('email', String(customerEmail).toLowerCase()).single()
            if (data?.id) resolvedUserId = data.id
          }
        } catch {}
        // Upsert into payment_customers if table exists
        try {
          await supabase.from('payment_customers').upsert({
            user_id: resolvedUserId,
            stripe_customer_id: customerId,
            email: customerEmail,
            subscription_id: subscriptionId,
            plan,
            last_checkout_session: session.id,
          }, { onConflict: 'stripe_customer_id' })
        } catch {}
        // Log system event
        try {
          await supabase.from('system_logs').insert({
            user_id: null,
            action: 'checkout.session.completed',
            details: `session=${session.id}`,
          })
        } catch {}
      }
    }
  } catch (e) {
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}


