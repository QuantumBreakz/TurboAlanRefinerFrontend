"use client"

/**
 * Stripe Error Handler Component
 * Suppresses non-critical Stripe errors that occur due to:
 * - Ad blockers blocking Stripe telemetry (r.stripe.com/b)
 * - CSP violations for fonts (from Stripe's checkout pages)
 * - Network errors from Stripe's internal scripts
 * 
 * These errors don't affect functionality and are safe to suppress.
 * Only suppresses errors that are clearly from Stripe's telemetry/analytics.
 */
import { useEffect } from "react"

export function StripeErrorHandler() {
  useEffect(() => {
    // Helper to check if error is from Stripe telemetry (non-critical)
    const isStripeTelemetryError = (error: any): boolean => {
      if (!error) return false
      
      const errorMessage = error?.message || String(error) || ""
      const errorStack = error?.stack || ""
      const errorString = `${errorMessage} ${errorStack}`.toLowerCase()

      // Check for Stripe telemetry endpoints
      const stripeTelemetryPatterns = [
        "r.stripe.com/b",
        "r.stripe.com",
        "stripe.com/b",
        "errors.stripe.com",
      ]

      // Check if it's a blocked request error for Stripe telemetry
      if (
        errorString.includes("err_blocked_by_client") &&
        stripeTelemetryPatterns.some(pattern => errorString.includes(pattern))
      ) {
        return true
      }

      // Check if it's a FetchError for Stripe telemetry
      if (
        errorMessage.includes("FetchError") &&
        stripeTelemetryPatterns.some(pattern => errorString.includes(pattern))
      ) {
        return true
      }

      // Check if it's a failed fetch for Stripe analytics
      if (
        errorMessage.includes("Failed to fetch") &&
        stripeTelemetryPatterns.some(pattern => errorString.includes(pattern))
      ) {
        return true
      }

      return false
    }

    // Suppress unhandled promise rejections from Stripe telemetry
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isStripeTelemetryError(event.reason)) {
        // Suppress Stripe telemetry errors (non-critical, don't affect functionality)
        event.preventDefault()
        return
      }
    }

    // Suppress console errors from Stripe telemetry (only in production-like environments)
    const shouldSuppressConsoleErrors = process.env.NODE_ENV === "production" || 
                                         window.location.hostname !== "localhost"

    let originalError: typeof console.error | null = null
    
    if (shouldSuppressConsoleErrors) {
      originalError = console.error
      console.error = (...args: any[]) => {
        const message = args.map(arg => 
          typeof arg === 'string' ? arg : 
          arg?.message || String(arg)
        ).join(" ").toLowerCase()
        
        // Only suppress if it's clearly a Stripe telemetry error
        if (
          message.includes("r.stripe.com/b") ||
          (message.includes("err_blocked_by_client") && message.includes("stripe")) ||
          (message.includes("failed to fetch") && message.includes("r.stripe.com"))
        ) {
          // Silently ignore - these are non-critical Stripe telemetry errors
          return
        }

        // Call original console.error for other errors
        if (originalError) {
          originalError.apply(console, args)
        }
      }
    }

    // Add event listener for unhandled promise rejections
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    // Cleanup
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
      if (originalError && shouldSuppressConsoleErrors) {
        console.error = originalError
      }
    }
  }, [])

  return null // This component doesn't render anything
}

