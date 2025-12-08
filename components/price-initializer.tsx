"use client"

/**
 * Price Initializer Component
 * Initializes Stripe price IDs on app startup by fetching from backend.
 * Backend will create products/prices in Stripe if they don't exist.
 */
import { useEffect } from "react"
import { initializePriceIds } from "@/lib/stripe-config"

export function PriceInitializer() {
  useEffect(() => {
    // Initialize price IDs when component mounts
    initializePriceIds().catch((error) => {
      console.error("Failed to initialize price IDs:", error)
    })
  }, [])

  return null // This component doesn't render anything
}

