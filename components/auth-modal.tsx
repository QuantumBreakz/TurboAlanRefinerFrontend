"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SignupModal from "./signup-modal"
import { useAuth } from "@/contexts/AuthContext"
import { useLoading } from "@/contexts/LoadingContext"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthenticated: () => void
}

export default function AuthModal({ isOpen, onClose, onAuthenticated }: AuthModalProps) {
  const { signin } = useAuth()
  const { startLoading, stopLoading } = useLoading()
  const [settings, setSettings] = useState({
    openaiApiKey: "",
    openaiModel: "gpt-4.1",
    targetScannerRisk: 15,
    minWordRatio: 0.8,
  })
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [signinData, setSigninData] = useState({
    email: "",
    password: ""
  })

  // Check for OAuth errors in URL when modal opens
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const urlError = params.get('error')
      if (urlError) {
        setError(decodeURIComponent(urlError))
        // Clear error from URL
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleGoogleAuth = () => {
    setError("")
    
    // Check if Google OAuth is configured
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!googleClientId) {
      setError("Google OAuth is not configured. Please contact support.")
      return
    }
    
    setIsLoading(true)
    startLoading("Connecting to Google...")
    
    // Redirect to Google OAuth (server will handle state generation and OAuth flow)
    window.location.href = '/api/auth/google'
  }

  const handleSignin = async () => {
    setError("")
    if (!signinData.email || !signinData.password) {
      setError("Email and password are required")
      return
    }

    setIsLoading(true)
    startLoading("Signing in...")
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "signin",
          email: signinData.email,
          password: signinData.password
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Sign in failed")
      }

      // Use AuthContext to properly set authentication state
      if (data.user && data.token) {
        signin(data.user, data.token)
        
        // Also set cookie for middleware (with actual token)
        try {
          const expires = new Date(Date.now() + 7*24*60*60*1000).toUTCString()
          document.cookie = `refiner_auth=${data.token}; Path=/; Expires=${expires}; SameSite=Lax`
        } catch {}

        // Save settings separately for compatibility
        if (data.user.settings) {
          localStorage.setItem("turbo-alan-settings", JSON.stringify(data.user.settings))
        }
      }

      stopLoading()
      onAuthenticated()
    } catch (err) {
      stopLoading()
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettingsSave = () => {
    // Save settings to localStorage or backend
    localStorage.setItem("turbo-alan-settings", JSON.stringify(settings))
    try {
      const expires = new Date(Date.now() + 7*24*60*60*1000).toUTCString()
      document.cookie = `refiner_auth=1; Path=/; Expires=${expires}; SameSite=Lax`
    } catch {}
    onAuthenticated()
  }

  const handleSignupSuccess = () => {
    setShowSignupModal(false)
    onAuthenticated()
  }

  const handleSwitchToSignup = () => {
    setShowSignupModal(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 bg-white border-gray-200 shadow-2xl">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <CardTitle className="text-gray-900">Welcome to Turbo Alan Refiner</CardTitle>
          <CardDescription className="text-gray-600">Configure your settings to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="auth" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger
                value="auth"
                className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                Authentication
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900"
              >
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="auth" className="space-y-4">
              <Button
                onClick={handleGoogleAuth}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600 border-0"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={signinData.email}
                  onChange={(e) => setSigninData({ ...signinData, email: e.target.value })}
                  className="border-gray-200 focus:border-yellow-400 focus:ring-yellow-400"
                />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={signinData.password}
                  onChange={(e) => setSigninData({ ...signinData, password: e.target.value })}
                  className="border-gray-200 focus:border-yellow-400 focus:ring-yellow-400"
                />
                <Button 
                  onClick={handleSignin} 
                  disabled={isLoading}
                  className="w-full bg-gray-900 text-white hover:bg-gray-800"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button
                    onClick={handleSwitchToSignup}
                    className="text-yellow-600 hover:text-yellow-700 font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-gray-700">
                  OpenAI API Key (Optional)
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-... (leave empty if not using AI features)"
                  value={settings.openaiApiKey}
                  onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                  className="border-gray-200 focus:border-yellow-400 focus:ring-yellow-400"
                />
                <p className="text-xs text-gray-500">
                  Optional: Add your OpenAI API key to enable AI-powered text refinement. Get your key from{" "}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:underline">
                    OpenAI Platform
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="text-gray-700">
                  OpenAI Model
                </Label>
                <select
                  id="model"
                  value={settings.openaiModel}
                  onChange={(e) => setSettings({ ...settings, openaiModel: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 focus:border-yellow-400 focus:ring-yellow-400 text-gray-900"
                >
                  <option value="gpt-4.1">GPT 4.1</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scannerRisk" className="text-gray-700">
                  Target Scanner Risk (%)
                </Label>
                <Input
                  id="scannerRisk"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.targetScannerRisk}
                  onChange={(e) => setSettings({ ...settings, targetScannerRisk: Number.parseInt(e.target.value) })}
                  className="border-gray-200 focus:border-yellow-400 focus:ring-yellow-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wordRatio" className="text-gray-700">
                  Min Word Ratio
                </Label>
                <Input
                  id="wordRatio"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.minWordRatio}
                  onChange={(e) => setSettings({ ...settings, minWordRatio: Number.parseFloat(e.target.value) })}
                  className="border-gray-200 focus:border-yellow-400 focus:ring-yellow-400"
                />
              </div>

              <Button
                onClick={handleSettingsSave}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600"
              >
                Save Settings & Continue
              </Button>
            </TabsContent>
          </Tabs>

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full mt-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>

      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSignupSuccess={handleSignupSuccess}
        onSwitchToSignin={() => setShowSignupModal(false)}
      />
    </div>
  )
}
