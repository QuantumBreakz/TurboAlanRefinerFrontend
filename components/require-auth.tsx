"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const auth = (() => { try { return useAuth() } catch { return null } })()
  const isAuthed = !!(auth && auth.isAuthenticated)
  const isInitialized = auth?.isInitialized ?? false
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Reset hasRedirected if user becomes authenticated
    if (isAuthed && hasRedirected) {
      setHasRedirected(false)
    }
  }, [isAuthed, hasRedirected])

  useEffect(() => {
    // Wait for auth to initialize before redirecting
    if (isInitialized && !isAuthed && !hasRedirected) {
      // Check if auth data exists in localStorage (might be restoring)
      let hasStoredAuth = false
      let hasValidToken = false
      try {
        const storedUser = localStorage.getItem('turbo-alan-user')
        const storedAuth = localStorage.getItem('refiner-auth-state')
        hasStoredAuth = !!(storedUser && storedAuth)
        
        // Also check cookie for token
        const cookies = document.cookie.split(';')
        const authCookie = cookies.find(c => c.trim().startsWith('refiner_auth='))
        if (authCookie) {
          const cookieToken = authCookie.split('=')[1]?.trim()
          hasValidToken = !!(cookieToken && cookieToken !== '1' && cookieToken.length > 10)
        }
        
        // Check if token exists in stored auth state
        if (storedAuth) {
          try {
            const authState = JSON.parse(storedAuth)
            if (authState?.token && authState.token.length > 10) {
              hasValidToken = true
            }
          } catch {}
        }
      } catch {}
      
      // If localStorage/cookie has auth data, wait longer for AuthContext to restore it
      // Give more time for state to propagate after a fresh signin
      const delay = (hasStoredAuth || hasValidToken) ? 1500 : 500
      
      const t = setTimeout(() => {
        // Check one more time if user is now authenticated
        // (AuthContext might have restored from localStorage)
        if (auth?.isAuthenticated) {
          setHasRedirected(false)
          return // User is now authenticated, don't redirect
        }
        
        // Double-check localStorage/cookie one more time
        try {
          const storedUser = localStorage.getItem('turbo-alan-user')
          const storedAuth = localStorage.getItem('refiner-auth-state')
          const cookies = document.cookie.split(';')
          const authCookie = cookies.find(c => c.trim().startsWith('refiner_auth='))
          const cookieToken = authCookie?.split('=')[1]?.trim()
          
          // If we have valid auth data but AuthContext hasn't picked it up, wait a bit more
          if ((storedUser && storedAuth) || (cookieToken && cookieToken !== '1' && cookieToken.length > 10)) {
            // Auth data exists but AuthContext hasn't updated yet - give it more time
            return
          }
        } catch {}
        
        setHasRedirected(true)
        router.replace('/?login=1')
      }, delay)
      return () => clearTimeout(t)
    }
  }, [isAuthed, isInitialized, hasRedirected, router, auth])

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading while redirecting
  if (!isAuthed && hasRedirected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2"></div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  if (!isAuthed) return null
  return <>{children}</>
}



