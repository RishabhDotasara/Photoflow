"use client"
import { useState } from 'react';
import { Upload, Cpu, Share2, ArrowRight } from 'lucide-react';
import { AccessRequestForm } from '@/components/accessREquestForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

function App() {
  const [showForm, setShowForm] = useState(false);

  const steps = [
    { icon: Upload, title: 'Upload', description: 'Upload event photos securely' },
    { icon: Cpu, title: 'Process', description: 'AI-powered organization & optimization' },
    { icon: Share2, title: 'Share', description: 'Instant distribution via secure links' },
  ];

 
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-7xl mx-auto">

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Side - Hero & Steps */}
          <div className="space-y-8">

            {/* Brand Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
                  <Upload className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">PhotoFlow</h1>
              </div>

              <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                Effortless Photo
                <br />
                <span className="text-primary">Distribution</span>
              </h2>

              <p className="text-lg text-muted-foreground max-w-md">
                Streamline your event photography workflow with our intelligent platform designed for seamless photo sharing.
              </p>

              {/* Built by badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Built by WebOps & Blockchain Club
              </div>
            </div>

            {/* Process Steps - Horizontal */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                How it works
              </h3>

              <div className="flex items-center gap-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex flex-col items-center text-center space-y-2 min-w-0">
                        <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {step.title}
                          </p>
                          <p className="text-xs text-muted-foreground leading-tight">
                            {step.description}
                          </p>
                        </div>
                      </div>

                      {index < steps.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side - CTA Card */}
          <div className="flex items-center justify-center">
            {!showForm ? (
              <Card className="w-full max-w-md bg-card border-border shadow-lg">
                <CardContent className="p-8 text-center space-y-6">

                  {/* Visual Element */}
                  <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-2xl font-semibold text-foreground">
                      Ready to Get Started?
                    </h3>
                    <p className="text-muted-foreground">
                      Join our platform and revolutionize how you share event photos with participants.
                    </p>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                  >
                    Request Access
                  </Button>

                  {/* Trust indicators */}
                  <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Secure
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      Fast
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      Reliable
                    </div>
                  </div>

                </CardContent>
              </Card>
            ) : (
              <AccessRequestForm />
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            © 2024 WebOps & Blockchain Club. All rights reserved.
          </p>
        </footer>
      </div>
    </div>  
  );
}

export default App;