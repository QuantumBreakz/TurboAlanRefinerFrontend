export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto py-8 md:py-16 px-4 md:px-6">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-2">About</h1>
      <p className="text-muted-foreground text-sm md:text-base">Learn about the project history and the team behind Turbo Alan Refiner.</p>
      <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="p-4 md:p-5 rounded-lg border bg-white">
          <div className="font-medium text-sm md:text-base">Origin</div>
          <div className="text-muted-foreground text-xs md:text-sm mt-1">Built from real needs to refine long technical documents reliably.</div>
        </div>
        <div className="p-4 md:p-5 rounded-lg border bg-white">
          <div className="font-medium text-sm md:text-base">Today</div>
          <div className="text-muted-foreground text-xs md:text-sm mt-1">Full-stack pipeline with streaming UX and pass-by-pass diffs.</div>
        </div>
      </div>
    </div>
  )
}


