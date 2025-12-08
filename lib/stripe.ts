/**
 * Stripe Service
 * Professional Stripe integration utilities for frontend.
 */

// Stripe types
export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  created: number;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  subscription_id: string;
  user_id: string;
  customer_id: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'cancelled';
  price_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  metadata?: Record<string, any>;
  stripe_details?: {
    id: string;
    customer: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    items: Array<{
      id: string;
      price: {
        id: string;
        unit_amount: number;
        currency: string;
        recurring?: {
          interval: string;
        };
      };
    }>;
  };
}

export interface StripePayment {
  payment_intent_id: string;
  user_id: string;
  customer_id: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CreateCheckoutSessionRequest {
  price_id: string;
  user_id: string;
  email: string;
  name?: string;
  success_url?: string;
  cancel_url?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionResponse {
  success: boolean;
  session_id: string;
  url: string;
}

export interface CreatePortalSessionRequest {
  user_id: string;
  return_url: string;
}

export interface CreatePortalSessionResponse {
  success: boolean;
  url: string;
}

export interface SubscriptionResponse {
  success: boolean;
  subscription: StripeSubscription | null;
}

export interface PaymentHistoryResponse {
  success: boolean;
  payments: StripePayment[];
}

/**
 * Create a Stripe Checkout Session
 */
export async function createCheckoutSession(
  request: CreateCheckoutSessionRequest
): Promise<CreateCheckoutSessionResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_REFINER_BACKEND_URL || 'http://localhost:8000';
  
  const response = await fetch(`${backendUrl}/stripe/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to create checkout session' }));
    throw new Error(error.detail || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Create a Stripe Customer Portal Session
 */
export async function createPortalSession(
  request: CreatePortalSessionRequest
): Promise<CreatePortalSessionResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_REFINER_BACKEND_URL || 'http://localhost:8000';
  
  const response = await fetch(`${backendUrl}/stripe/create-portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to create portal session' }));
    throw new Error(error.detail || 'Failed to create portal session');
  }

  return response.json();
}

/**
 * Get active subscription for a user
 */
export async function getSubscription(userId: string): Promise<SubscriptionResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_REFINER_BACKEND_URL || 'http://localhost:8000';
  
  const response = await fetch(`${backendUrl}/stripe/subscription/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get subscription' }));
    throw new Error(error.detail || 'Failed to get subscription');
  }

  return response.json();
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<{ success: boolean; subscription: any }> {
  const backendUrl = process.env.NEXT_PUBLIC_REFINER_BACKEND_URL || 'http://localhost:8000';
  
  const response = await fetch(`${backendUrl}/stripe/cancel-subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscription_id: subscriptionId,
      immediately,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to cancel subscription' }));
    throw new Error(error.detail || 'Failed to cancel subscription');
  }

  return response.json();
}

/**
 * Get payment history for a user
 */
export async function getPaymentHistory(
  userId: string,
  limit: number = 10
): Promise<PaymentHistoryResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_REFINER_BACKEND_URL || 'http://localhost:8000';
  
  const response = await fetch(`${backendUrl}/stripe/payment-history/${userId}?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to get payment history' }));
    throw new Error(error.detail || 'Failed to get payment history');
  }

  return response.json();
}

/**
 * Check if user has active subscription
 */
export function hasActiveSubscription(subscription: StripeSubscription | null): boolean {
  if (!subscription) return false;
  
  const activeStatuses = ['active', 'trialing', 'past_due'];
  return activeStatuses.includes(subscription.status);
}

/**
 * Format subscription status for display
 */
export function formatSubscriptionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past Due',
    canceled: 'Cancelled',
    cancelled: 'Cancelled',
    unpaid: 'Unpaid',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired',
  };
  
  return statusMap[status] || status;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100); // Stripe amounts are in cents
}

