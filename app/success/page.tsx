"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"

export default function SuccessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sid = params.get("session_id")
    if (sid) setSessionId(sid)

    // Refresh user data after successful payment
    // The webhook should have updated the subscription, but we can verify
    if (user?.id) {
      // Give webhook a moment to process, then redirect
      setTimeout(() => {
        setLoading(false)
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }, 1000)
    } else {
      setLoading(false)
    }
  }, [user, router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you! Your subscription has been activated. You will be redirected to your dashboard shortly.
          </p>
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground">Processing...</div>
        ) : (
          <Link 
            href="/dashboard" 
            className="inline-block px-6 py-3 rounded-md bg-yellow-400 text-black font-medium hover:bg-yellow-500 transition-colors"
          >
            Go to Dashboard
          </Link>
        )}
      </div>
    </div>
  )
}





