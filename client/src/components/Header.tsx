import { Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function Header() {
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">AutoMind</span>
            <span className="text-xs text-muted-foreground -mt-0.5">Legal Copilot</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#workflow" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
            Sign In
          </Button>
          <Button variant="hero" size="sm" className="gap-2" onClick={() => navigate("/signup")}>
            <Sparkles className="h-4 w-4" />
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}
