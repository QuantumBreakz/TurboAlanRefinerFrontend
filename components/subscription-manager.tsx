"use client"

/**
 * Subscription Manager Component
 * Professional subscription management UI with Stripe integration.
 */
import React, { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import {
  getSubscription,
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  hasActiveSubscription,
  formatSubscriptionStatus,
  formatCurrency,
  type StripeSubscription,
} from "@/lib/stripe"
import { getPriceIdAsync, getPriceIdsAsync } from "@/lib/stripe-config"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, Calendar, X } from "lucide-react"
import { toast } from "sonner"

interface SubscriptionManagerProps {
  onSubscriptionChange?: (subscription: StripeSubscription | null) => void
}

export function SubscriptionManager({ onSubscriptionChange }: SubscriptionManagerProps) {
  const { user, isAuthenticated } = useAuth()
  const [subscription, setSubscription] = useState<StripeSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      loadSubscription()
    }
  }, [isAuthenticated, user])

  const loadSubscription = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const response = await getSubscription(user.id)
      setSubscription(response.subscription)
      onSubscriptionChange?.(response.subscription)
    } catch (error: any) {
      console.error("Failed to load subscription:", error)
      toast.error(error.message || "Failed to load subscription")
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      toast.error("Please sign in to subscribe")
      return
    }

    try {
      setProcessing(true)
      const response = await createCheckoutSession({
        price_id: priceId,
        user_id: user.id,
        email: user.email,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
        success_url: `${window.location.origin}/dashboard?subscription=success`,
        cancel_url: `${window.location.origin}/dashboard?subscription=cancelled`,
      })

      // Redirect to Stripe Checkout
      window.location.href = response.url
    } catch (error: any) {
      console.error("Failed to create checkout session:", error)
      toast.error(error.message || "Failed to start checkout")
      setProcessing(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!user) return

    try {
      setProcessing(true)
      const response = await createPortalSession({
        user_id: user.id,
        return_url: `${window.location.origin}/dashboard`,
      })

      // Redirect to Stripe Customer Portal
      window.location.href = response.url
    } catch (error: any) {
      console.error("Failed to open customer portal:", error)
      toast.error(error.message || "Failed to open customer portal")
      setProcessing(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscription) return

    if (!confirm("Are you sure you want to cancel your subscription? You'll lose access at the end of the billing period.")) {
      return
    }

    try {
      setProcessing(true)
      await cancelSubscription(subscription.subscription_id, false)
      toast.success("Subscription cancelled. You'll retain access until the end of the billing period.")
      await loadSubscription()
    } catch (error: any) {
      console.error("Failed to cancel subscription:", error)
      toast.error(error.message || "Failed to cancel subscription")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
        </CardContent>
      </Card>
    )
  }

  const isActive = hasActiveSubscription(subscription)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription
        </CardTitle>
        <CardDescription>
          Manage your subscription and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isActive && subscription ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Plan</p>
                <p className="text-sm text-muted-foreground">
                  {subscription.stripe_details?.items[0]?.price?.id || subscription.price_id}
                </p>
              </div>
              <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                {formatSubscriptionStatus(subscription.status)}
              </Badge>
            </div>

            {subscription.stripe_details && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Current period: {new Date(subscription.stripe_details.current_period_start * 1000).toLocaleDateString()} - {new Date(subscription.stripe_details.current_period_end * 1000).toLocaleDateString()}
                  </span>
                </div>
                {subscription.stripe_details.items[0]?.price && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>
                      {formatCurrency(
                        subscription.stripe_details.items[0].price.unit_amount,
                        subscription.stripe_details.items[0].price.currency
                      )}{" "}
                      / {subscription.stripe_details.items[0].price.recurring?.interval || "month"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {subscription.cancel_at_period_end && (
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3 text-sm text-yellow-800 dark:text-yellow-200">
                Your subscription will be cancelled at the end of the current billing period.
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleManageSubscription}
                disabled={processing}
                variant="outline"
                className="flex-1"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Manage Subscription"
                )}
              </Button>
              {!subscription.cancel_at_period_end && (
                <Button
                  onClick={handleCancelSubscription}
                  disabled={processing}
                  variant="destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You don't have an active subscription. Choose a plan to get started.
            </p>
            <Button
              onClick={() => window.location.href = "/pricing"}
              className="w-full"
            >
              View Plans
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

