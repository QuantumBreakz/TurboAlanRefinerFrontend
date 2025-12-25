export const metadata = {
  title: 'Pricing – Turbo Alan Refiner',
  description: 'Fair pricing for creators, teams, and enterprises. Start free and scale.',
}

import PricingClient from "@/components/pricing-client"

export default function PricingPage() {
  const tiers = [
    { name: 'Starter', price: '$0', period: '', tagline: 'Try refinement on a single file', cta: 'Get Started', href: '/checkout?plan=Starter', popular: false, features: [
      '1 concurrent job', 'Diff viewer', 'Local downloads', 'Community support'
    ], limits: ['Up to 2 passes per job', 'Max 20k tokens per input'] },
    { name: 'Pro', price: '$29', period: '/mo', tagline: 'Scale refinement for teams', cta: 'Start Pro', href: '/checkout', popular: true, features: [
      'Batch processing', 'Analytics dashboard', 'Priority streaming', 'Email support'
    ], limits: ['Up to 6 passes per job', 'Max 100k tokens per input'] },
    { name: 'Enterprise', price: 'Custom', period: '', tagline: 'Custom deployments and SLAs', cta: 'Contact Sales', href: '/contact', popular: false, features: [
      'SSO & audit logs', 'Custom pipelines', 'Dedicated support', 'On‑prem or VPC'
    ], limits: ['Unlimited passes', 'Custom token budgets'] },
  ]
  const faqs = [
    { q: 'Do you store my files?', a: 'Outputs are saved locally by default in your environment. No external storage unless configured (e.g., Google Drive).' },
    { q: 'Can I cancel anytime?', a: 'Yes. Pro plans are month‑to‑month with no lock‑in. You can cancel from your billing portal.' },
    { q: 'Is there an API?', a: 'Yes, the backend exposes endpoints for refinement, jobs, diffs, and analytics. See Documentation → API.' },
  ]
  const comparison = [
    { feature: 'Concurrent jobs', starter: '1', pro: '5', enterprise: 'Custom' },
    { feature: 'Passes per job', starter: '2', pro: '6', enterprise: 'Unlimited' },
    { feature: 'Analytics dashboard', starter: 'Basic', pro: 'Full', enterprise: 'Custom KPIs' },
    { feature: 'Support', starter: 'Community', pro: 'Email', enterprise: 'Dedicated' },
  ]
  const testimonials = [
    { name: 'A. Patel', role: 'MedTech PM', text: 'Cut our review cycles by 40% while keeping clinical tone intact.' },
    { name: 'J. Rivera', role: 'Legal Ops Lead', text: 'Batch refinement + diffing made redlines predictable and fast.' },
  ]
  return (
    <div className="max-w-6xl mx-auto py-8 md:py-16 px-4 md:px-6">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold">Pricing that fits your workflow</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">Fair pricing that scales from individual creators to enterprise teams.</p>
      </div>

      <PricingClient baseTiers={tiers} />

      {/* Comparison table */}
      <div className="mt-12 md:mt-16">
        <h3 className="text-lg md:text-xl font-semibold mb-3">Compare plans</h3>
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 rounded-xl border bg-white">
          <table className="w-full text-xs md:text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-2 md:p-3">Feature</th>
                <th className="p-2 md:p-3">Starter</th>
                <th className="p-2 md:p-3">Pro</th>
                <th className="p-2 md:p-3">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.feature} className="border-t">
                  <td className="p-2 md:p-3 font-medium">{row.feature}</td>
                  <td className="p-2 md:p-3">{row.starter}</td>
                  <td className="p-2 md:p-3">{row.pro}</td>
                  <td className="p-2 md:p-3">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Testimonials */}
      <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {testimonials.map((t) => (
          <div key={t.name} className="p-4 md:p-6 rounded-xl border bg-white">
            <div className="text-xs md:text-sm text-muted-foreground">{t.role}</div>
            <div className="mt-2 text-sm md:text-base">"{t.text}"</div>
            <div className="mt-3 text-xs md:text-sm font-medium">{t.name}</div>
          </div>
        ))}
      </div>

      {/* FAQs */}
      <div className="mt-12 md:mt-16">
        <h3 className="text-lg md:text-xl font-semibold mb-3">FAQs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {faqs.map((f) => (
            <div key={f.q} className="p-4 md:p-5 rounded-lg border bg-white">
              <div className="font-medium text-sm md:text-base">{f.q}</div>
              <div className="text-muted-foreground mt-1 text-xs md:text-sm">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


