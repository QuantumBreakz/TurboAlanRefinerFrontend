"use client"

import Link from "next/link"
import { ArrowLeft, Menu, X } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import UserMenu from "@/components/user-menu"
import { useState } from "react"

interface HeaderProps {
  onLoginClick: () => void
  showBackButton?: boolean
  onBackClick?: () => void
  isAuthenticated?: boolean
}

export default function Header({
  onLoginClick,
  showBackButton = false,
  onBackClick,
  isAuthenticated = false,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const ctx = (() => { try { return useAuth() } catch { return null } })()
  const authed = ctx ? ctx.isAuthenticated : isAuthenticated
  const doLogout = async () => {
    if (ctx) {
      await ctx.signout()
    } else {
      try {
        // Clear client state
        try { localStorage.removeItem('refiner-auth-state') } catch {}
        try { localStorage.removeItem('turbo-alan-user') } catch {}
        // Clear cookie server-side
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch {}
      // Redirect to hero page
      window.location.href = '/'
    }
  }
  return (
    <header className="relative z-20 flex items-center justify-between p-4 md:p-6">
      <div className="flex items-center gap-2 md:gap-4">
        {showBackButton && (
          <button
            onClick={onBackClick}
            className="flex items-center gap-1 md:gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 px-2 md:px-3 py-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs md:text-sm font-medium hidden sm:inline">Back</span>
          </button>
        )}

        <Link href={showBackButton ? "/dashboard" : "/"} className="text-white font-medium text-base md:text-lg flex items-center gap-2">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border border-yellow-300/50">
            <span className="text-white font-bold text-xs md:text-sm drop-shadow-sm">T</span>
          </div>
          <span className="instrument hidden sm:inline">Turbo Alan Refiner</span>
          <span className="instrument sm:hidden">TAR</span>
        </Link>
      </div>

      {/* Desktop Navigation */}
      {!showBackButton && (
        <nav className="hidden md:flex items-center space-x-2">
          <Link
            href="/features"
            className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
          >
            Features
          </Link>
          <Link
            href="/product"
            className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
          >
            How it Works
          </Link>
          <Link
            href="/pricing"
            className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
          >
            Pricing
          </Link>
        </nav>
      )}

      {/* Mobile Menu Button */}
      {!showBackButton && (
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-b border-white/10 md:hidden z-30">
          <nav className="flex flex-col p-4 space-y-2">
            <Link
              href="/features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white/80 hover:text-white text-sm font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
            >
              Features
            </Link>
            <Link
              href="/product"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white/80 hover:text-white text-sm font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
            >
              How it Works
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white/80 hover:text-white text-sm font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
            >
              Pricing
            </Link>
            {!authed && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onLoginClick()
                }}
                className="w-full mt-2 px-6 py-2 rounded-full bg-white text-black font-normal text-sm transition-all duration-200 hover:bg-gradient-to-r hover:from-yellow-400 hover:to-yellow-500"
              >
                Login
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Desktop Login/Auth */}
      {!showBackButton && !authed && (
        <div id="gooey-btn" className="hidden md:flex items-center group relative" style={{ filter: "url(#gooey-filter)" }}>
          <button className="absolute right-0 px-2.5 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-normal text-xs transition-all duration-300 hover:from-yellow-300 hover:to-yellow-400 cursor-pointer h-8 flex items-center justify-center -translate-x-10 group-hover:-translate-x-19 z-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </button>
          <button
            onClick={onLoginClick}
            className="px-6 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-gradient-to-r hover:from-yellow-400 hover:to-yellow-500 cursor-pointer h-8 flex items-center z-10"
          >
            Login
          </button>
        </div>
      )}
      
      {/* Show UserMenu when authenticated (both on dashboard and home) */}
      {authed && (
        <div className="hidden md:block">
          <UserMenu />
        </div>
      )}

      {/* Mobile UserMenu */}
      {authed && mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-b border-white/10 z-30 p-4">
          <UserMenu />
        </div>
      )}
    </header>
  )
}
