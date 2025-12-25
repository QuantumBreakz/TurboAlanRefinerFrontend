"use client"

import { useState, useEffect } from "react"

interface HeroContentProps {
  onGetStarted: () => void
}

export default function HeroContent({ onGetStarted }: HeroContentProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)

  const animatedTexts = [
    "Reduce AI detection flags by up to 95%",
    "Process documents in intelligent batches",
    "Integrate seamlessly with Google Drive",
    "Fine-tune rewrite intensity for perfect results",
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % animatedTexts.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-auto z-20 max-w-2xl">
      <div className="text-left">
        <div
          className="inline-flex items-center px-2 md:px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm mb-3 md:mb-4 relative border border-white/20"
          style={{
            filter: "url(#glass-effect)",
          }}
        >
          <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent rounded-full" />
          <span className="text-white text-xs font-light relative z-10">✨ AI Text Refiner</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl md:leading-16 tracking-tight font-light text-white mb-4 md:mb-6">
          <span className="font-medium italic instrument">Turbo</span> Alan
          <br />
          <span className="font-light tracking-tight text-white">Refiner</span>
        </h1>

        <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
          <p className="text-xs sm:text-sm font-light text-white/90 leading-relaxed">
            The most advanced AI text refinement platform designed for content creators, students, and professionals who
            need human-like text that passes detection systems.
          </p>

          <div className="h-6 overflow-hidden">
            <div
              className="transition-transform duration-500 ease-in-out"
              style={{ transform: `translateY(-${currentTextIndex * 24}px)` }}
            >
              {animatedTexts.map((text, index) => (
                <p key={index} className="text-xs font-light text-yellow-300 h-6 flex items-center">
                  → {text}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-3 mb-4 md:mb-6 text-xs">
          <div className="flex items-center gap-1 md:gap-2 text-white/70">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0"></div>
            <span className="truncate">Multi-pass processing</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 text-white/70">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0"></div>
            <span className="truncate">Batch operations</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 text-white/70">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0"></div>
            <span className="truncate">Google Drive sync</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2 text-white/70">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 flex-shrink-0"></div>
            <span className="truncate">Tunable intensity</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
          <button
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            className="px-6 md:px-8 py-2.5 md:py-3 rounded-full bg-transparent border border-white/30 text-white font-normal text-xs transition-all duration-200 hover:bg-white/10 hover:border-white/50 cursor-pointer"
          >
            Learn More
          </button>
          <button
            onClick={onGetStarted}
            className="px-6 md:px-8 py-2.5 md:py-3 rounded-full bg-white text-black font-normal text-xs transition-all duration-200 hover:bg-gradient-to-r hover:from-yellow-400 hover:to-yellow-500 cursor-pointer"
          >
            Get Started Free
          </button>
        </div>
      </div>
    </main>
  )
}
