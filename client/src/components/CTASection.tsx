import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            Start Your Free Trial Today
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to Automate Your{" "}
            <span className="gradient-text">Legal Work?</span>
          </h2>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of legal professionals who have transformed their document 
            workflows with AutoMind's autonomous AI system.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" className="gap-3">
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="glass" size="xl">
              Schedule Demo
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
