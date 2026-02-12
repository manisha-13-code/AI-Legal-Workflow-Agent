import { Upload, ArrowRight, Shield, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in">
            <Zap className="h-4 w-4" />
            AI-Powered Legal Intelligence
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Legal Documents,{" "}
            <span className="gradient-text">Automatically</span>{" "}
            Understood
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Upload any legal document and let AutoMind analyze risks, identify obligations, 
            and plan your next actions — all autonomously.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl" className="gap-3">
              <Upload className="h-5 w-5" />
              Upload Document
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="glass" size="xl">
              Watch Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm">Bank-Level Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="text-sm">Learns From Every Document</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-sm">90% Faster Analysis</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
