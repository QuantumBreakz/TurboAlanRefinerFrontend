export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 md:py-16 px-4 md:px-6">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-2">Contact</h1>
      <p className="text-muted-foreground text-sm md:text-base mb-4 md:mb-6">Have questions? Reach out to the team.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="p-4 md:p-5 rounded-lg border bg-white">
          <div className="font-medium text-sm md:text-base">Support</div>
          <div className="text-muted-foreground text-xs md:text-sm mt-1 break-all">support@example.com</div>
        </div>
        <div className="p-4 md:p-5 rounded-lg border bg-white">
          <div className="font-medium text-sm md:text-base">Sales</div>
          <div className="text-muted-foreground text-xs md:text-sm mt-1 break-all">sales@example.com</div>
        </div>
      </div>
    </div>
  )
}


