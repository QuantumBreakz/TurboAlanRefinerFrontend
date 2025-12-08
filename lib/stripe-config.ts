/**
 * Stripe Configuration
 * Dynamically fetches Stripe price IDs from backend.
 * Backend creates products/prices in Stripe if they don't exist.
 * 
 * Pro and Enterprise plans are automatically configured with proper sections/metadata.
 */

let cachedPriceIds: Record<string, string> | null = null;
let fetchPromise: Promise<Record<string, string>> | null = null;

/**
 * Fetch price IDs from backend
 * Backend will create products/prices in Stripe if they don't exist
 */
async function fetchPriceIds(): Promise<Record<string, string>> {
  // Return cached if available
  if (cachedPriceIds) {
    return cachedPriceIds;
  }

  // Return existing promise if already fetching
  if (fetchPromise) {
    return fetchPromise;
  }

  // Fetch from backend
  fetchPromise = (async () => {
    try {
      // Try frontend API route first (proxies to backend)
      const response = await fetch('/api/stripe/prices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch price IDs from backend');
      }

      const data = await response.json();
      
      if (data.success && data.price_ids) {
        cachedPriceIds = {
          Starter: data.price_ids.Starter || "",
          Pro: data.price_ids.Pro || "",
          Enterprise: data.price_ids.Enterprise || "",
        };
        return cachedPriceIds;
      }

      throw new Error('Invalid response from backend');
    } catch (error) {
      console.error('Error fetching price IDs:', error);
      // Return fallback values
      return {
        Starter: "",
        Pro: "",
        Enterprise: "",
      };
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * Get price IDs (synchronous - returns cached or empty)
 * For async fetching, use getPriceIdsAsync()
 */
export const STRIPE_PRICE_IDS: Record<string, string> = {
  Starter: "",
  Pro: "",
  Enterprise: "",
};

/**
 * Initialize price IDs by fetching from backend
 * Call this on app startup or when needed
 */
export async function initializePriceIds(): Promise<void> {
  const priceIds = await fetchPriceIds();
  Object.assign(STRIPE_PRICE_IDS, priceIds);
}

/**
 * Get price IDs asynchronously
 * Fetches from backend if not cached
 */
export async function getPriceIdsAsync(): Promise<Record<string, string>> {
  return await fetchPriceIds();
}

/**
 * Get price ID for a plan name (synchronous - uses cached values)
 */
export function getPriceId(planName: string): string {
  const normalizedPlan = planName.charAt(0).toUpperCase() + planName.slice(1).toLowerCase();
  return STRIPE_PRICE_IDS[normalizedPlan] || STRIPE_PRICE_IDS.Pro || "";
}

/**
 * Get price ID for a plan name (async - fetches if needed)
 */
export async function getPriceIdAsync(planName: string): Promise<string> {
  const priceIds = await fetchPriceIds();
  const normalizedPlan = planName.charAt(0).toUpperCase() + planName.slice(1).toLowerCase();
  return priceIds[normalizedPlan] || priceIds.Pro || "";
}

/**
 * Get plan name from price ID (reverse lookup)
 */
export function getPlanName(priceId: string): string {
  for (const [plan, id] of Object.entries(STRIPE_PRICE_IDS)) {
    if (id === priceId) {
      return plan;
    }
  }
  // Fallback: try to extract from price ID
  const lower = priceId.toLowerCase();
  if (lower.includes("starter")) return "Starter";
  if (lower.includes("pro") || lower.includes("professional")) return "Pro";
  if (lower.includes("enterprise")) return "Enterprise";
  return "Pro"; // Default
}

/**
 * Clear cache (useful for testing or when prices are updated)
 */
export function clearPriceIdCache(): void {
  cachedPriceIds = null;
  fetchPromise = null;
}
