export default function BlogPage() {
  return (
    <div className="max-w-6xl mx-auto py-8 md:py-16 px-4 md:px-6">
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-2">Blog</h1>
      <p className="text-muted-foreground text-sm md:text-base">Updates, guides, and announcements.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
        {[{
          t:'Introducing Multi-Pass Diffing',
          d:'See exactly what changed between passes and why it matters.',
          i:'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop'
        },{
          t:'SSE in Production',
          d:'How we ship reliable streaming with proxies and keepalives.',
          i:'https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=1200&auto=format&fit=crop'
        },{
          t:'Measuring Quality',
          d:'Change percent, tension, and risk reduction explained.',
          i:'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1200&auto=format&fit=crop'
        }].map((p)=>(
          <a key={p.t} href="#" className="rounded-lg border bg-white overflow-hidden hover:bg-gray-50">
            <img src={p.i} alt={p.t} className="h-28 md:h-36 w-full object-cover" />
            <div className="p-4 md:p-5">
              <div className="font-medium text-sm md:text-base">{p.t}</div>
              <div className="text-muted-foreground text-xs md:text-sm mt-1">{p.d}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}


