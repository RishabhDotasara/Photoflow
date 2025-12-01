import React from 'react'
import { Github, Linkedin, Twitter, Mail, Globe, Camera, Upload, Users, Download, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

export default function About() {
  const steps = [
    {
      icon: Upload,
      title: "Upload Your Photos",
      description: "Create a project and upload your event photos from Google Drive or directly from your device."
    },
    {
      icon: Sparkles,
      title: "AI Processing",
      description: "Our AI automatically detects and indexes all faces in your photos for quick searching."
    },
    {
      icon: Camera,
      title: "Take a Selfie",
      description: "Guests take a quick selfie using their phone camera - no app download required."
    },
    {
      icon: Download,
      title: "Download Photos",
      description: "Instantly find and download all photos featuring that person in seconds."
    }
  ]

  const features = [
    "Face recognition powered by InsightFace AI",
    "Support for RAW image formats (ARW, NEF, CR2, etc.)",
    "Automatic thumbnail generation",
    "Batch download as ZIP",
    "Google Drive integration",
    "No guest login required",
    "Mobile-friendly interface",
    "Secure S3 storage"
  ]

  const socialLinks = [
    {
      name: "GitHub",
      icon: Github,
      href: "https://github.com/RishabhDotasara",
      username: "@RishabhDotasara"
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: "https://www.linkedin.com/in/rishabhdotasara2027/",
      username: "Your Name"
    },
    // {
    //   name: "Twitter",
    //   icon: Twitter,
    //   href: "https://twitter.com/yourusername",
    //   username: "@yourusername"
    // },
    {
      name: "Email",
      icon: Mail,
      href: "mailto:dotasararishabh@gmail.com",
      username: "dotasararishabh@gmail.com"
    },
    {
      name: "Website",
      icon: Globe,
      href: "https://rishabhdotasara.github.io",
      username: "rishabhdotasara.github.io"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Camera className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Photoflow</span>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/">
                Back to App
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <Badge variant="secondary" className="mb-2">Open Source Project</Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            About Photoflow
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AI-powered photo distribution for events. Help your guests find themselves
            in hundreds of photos with just a selfie.
          </p>
        </section>

        <Separator />

        {/* How It Works */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">How It Works</h2>
            <p className="text-sm text-muted-foreground">
              Four simple steps to distribute your event photos
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {steps.map((step, index) => (
              <Card key={index} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <step.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <Badge variant="outline" className="text-xs mb-1">
                        Step {index + 1}
                      </Badge>
                      <CardTitle className="text-base">{step.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* Features */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Features</h2>
            <p className="text-sm text-muted-foreground">
              Built with modern tech for the best experience
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* For Event Organizers */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">For Event Organizers</h2>
            <p className="text-sm text-muted-foreground">
              Quick guide to get started
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">Create a Project</p>
                    <p className="text-sm text-muted-foreground">
                      Sign in and create a new project for your event. Give it a name and optional description.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Upload photos</p>
                    <p className="text-sm text-muted-foreground">
                      Upload your event photos!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-sm">Wait for Processing</p>
                    <p className="text-sm text-muted-foreground">
                      Our AI will process all photos, generating thumbnails and indexing faces. This may take a few minutes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium flex-shrink-0">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-sm">Share the Link</p>
                    <p className="text-sm text-muted-foreground">
                      Copy the guest link and share it with attendees. They can take a selfie to find their photos instantly.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* For Guests */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">For Guests</h2>
            <p className="text-sm text-muted-foreground">
              Finding your photos is easy
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid sm:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="h-12 w-12 mx-auto rounded-lg bg-muted flex items-center justify-center">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-sm">Open the Link</p>
                  <p className="text-xs text-muted-foreground">
                    Use the link shared by the organizer
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="h-12 w-12 mx-auto rounded-lg bg-muted flex items-center justify-center">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-sm">Take a Selfie</p>
                  <p className="text-xs text-muted-foreground">
                    Allow camera access and capture your face
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="h-12 w-12 mx-auto rounded-lg bg-muted flex items-center justify-center">
                    <Download className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-sm">Download</p>
                  <p className="text-xs text-muted-foreground">
                    Get all your photos as a ZIP file
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Developer Section */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Meet the Developer</h2>
            <p className="text-sm text-muted-foreground">
              Built with passion for photography and technology
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Avatar */}
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl font-bold text-muted-foreground">YN</span>
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold">Rishabh Dotasara</h3>
                    <p className="text-sm text-muted-foreground">
                      Full Stack Developer
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Passionate about building tools that solve real problems.
                    This project was born from the frustration of manually sorting
                    through hundreds of event photos to find the ones with me in them.
                  </p>

                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    <Badge variant="secondary">Python</Badge>
                    <Badge variant="secondary">FastAPI</Badge>
                    <Badge variant="secondary">Next.js</Badge>
                    <Badge variant="secondary">React</Badge>
                    <Badge variant="secondary">TypeScript</Badge>
                    <Badge variant="secondary">PostgreSQL</Badge>
                    <Badge variant="secondary">Redis</Badge>
                    <Badge variant="secondary">Celery</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted transition-colors"
              >
                <social.icon className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{social.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{social.username}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        <Separator />

       
        <Separator />

        {/* CTA */}
        <section className="text-center space-y-4 pb-8">
          <h2 className="text-xl font-semibold">Ready to get started?</h2>
          <p className="text-sm text-muted-foreground">
            Create your first project and start distributing photos
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild>
              <Link href="/home">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href="https://github.com/RishabhDotasara/Photoflow" target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4 mr-2" />
                View Source
              </a>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-sm text-muted-foreground text-center">
            Made with ❤️ by <span className="font-medium text-foreground">Webops & Blockchain Club</span>
          </p>
        </div>
      </footer>
    </div>
  )
}