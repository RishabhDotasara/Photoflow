import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Camera, Zap, Shield } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-primary" />
            <span className="text-xl font-semibold">SelfieMatch</span>
          </div>
          <Link href="/signup">
            <Button>Sign up</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-bold text-foreground leading-tight">Find your perfect match</h1>
              <p className="text-xl text-muted-foreground">
                Upload your selfie and instantly discover matching images from our collection. Fast, simple, and secure.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Get started
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Learn more
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative h-96 sm:h-full min-h-96 rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center">
            <svg viewBox="0 0 400 500" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Phone frame */}
              <rect
                x="50"
                y="30"
                width="300"
                height="440"
                rx="30"
                fill="currentColor"
                className="text-muted-foreground/20"
                stroke="currentColor"
                strokeWidth="2"
                
              />

              {/* Phone screen */}
              <rect x="60" y="50" width="280" height="400" rx="25" fill="white" />

              {/* Status bar */}
              <rect x="60" y="50" width="280" height="30" rx="25" fill="hsl(var(--primary))" />
              <text x="200" y="72" textAnchor="middle" className="text-xs font-semibold" fill="white">
                9:41
              </text>

              {/* Camera viewfinder */}
              <circle
                cx="200"
                cy="180"
                r="70"
                fill="hsl(var(--primary))/10"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
              />
              <circle cx="200" cy="180" r="60" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" />

              {/* Camera icon */}
              <g transform="translate(200, 180)">
                <circle cx="0" cy="0" r="8" fill="hsl(var(--primary))" />
                <circle cx="0" cy="0" r="12" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
              </g>

              {/* Upload button */}
              <rect x="100" y="300" width="200" height="50" rx="12" fill="hsl(var(--primary))" />
              <text x="200" y="332" textAnchor="middle" className="text-sm font-semibold" fill="white">
                Upload Selfie
              </text>

              {/* Decorative elements */}
              <circle cx="90" cy="90" r="4" fill="hsl(var(--primary))" opacity="0.6" />
              <circle cx="310" cy="100" r="3" fill="hsl(var(--primary))" opacity="0.4" />
              <circle cx="85" cy="420" r="3" fill="hsl(var(--primary))" opacity="0.5" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 border-t border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why choose SelfieMatch?</h2>
            <p className="text-lg text-muted-foreground">Everything you need to find your perfect match</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="space-y-4 p-6 rounded-xl border border-border bg-background hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Lightning fast</h3>
              <p className="text-muted-foreground">Get results in seconds with our advanced matching algorithm</p>
            </div>

            {/* Feature 2 */}
            <div className="space-y-4 p-6 rounded-xl border border-border bg-background hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Secure & private</h3>
              <p className="text-muted-foreground">Your data is encrypted and never shared with third parties</p>
            </div>

            {/* Feature 3 */}
            <div className="space-y-4 p-6 rounded-xl border border-border bg-background hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Easy to use</h3>
              <p className="text-muted-foreground">Simply upload a photo and let our AI do the work</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-primary text-primary-foreground rounded-2xl p-12 text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to find your match?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Join thousands of users who are already discovering their perfect matches
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary">
              Sign up now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              <span className="font-semibold">SelfieMatch</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 SelfieMatch. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
