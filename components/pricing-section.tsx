"use client"

import { Check } from "lucide-react"

interface PricingSectionProps {
  onGetStarted: (planName: string) => void
}

export default function PricingSection({ onGetStarted }: PricingSectionProps) {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for trying out Turbo Alan Refiner",
      features: ["5 documents per month", "Basic refinement settings", "Standard processing speed", "Email support"],
      popular: false,
    },
    {
      name: "Professional",
      price: "$19",
      period: "/month",
      description: "Ideal for content creators and professionals",
      features: [
        "Unlimited documents",
        "Advanced refinement controls",
        "Priority processing",
        "Google Drive integration",
        "Batch processing",
        "Analytics dashboard",
        "Priority support",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For teams and organizations",
      features: [
        "Everything in Professional",
        "Team collaboration",
        "Custom integrations",
        "Advanced analytics",
        "Dedicated support",
        "SLA guarantee",
      ],
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="py-12 md:py-20 px-4 md:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-3 md:mb-4">
            <span className="instrument italic">Simple</span> Pricing
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your needs. Start free, upgrade anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 ${
                plan.popular
                  ? "border-yellow-400 shadow-lg md:scale-105"
                  : "border-gray-200 hover:border-yellow-200 hover:shadow-lg"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 md:-top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-4 md:mb-6">
                <h3 className="text-xl md:text-2xl font-medium text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl md:text-4xl font-light text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-sm md:text-base text-gray-600">{plan.period}</span>}
                </div>
                <p className="text-sm md:text-base text-gray-600">{plan.description}</p>
              </div>

              <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-2 md:gap-3">
                    <Check className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 flex-shrink-0" />
                    <span className="text-sm md:text-base text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onGetStarted(plan.name)}
                className={`w-full py-2.5 md:py-3 px-6 rounded-full font-medium transition-all duration-200 text-sm md:text-base ${
                  plan.popular
                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
