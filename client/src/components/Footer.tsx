import { Brain } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-semibold">AutoMind</span>
              <span className="text-muted-foreground text-sm ml-1">Legal Copilot</span>
            </div>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Security</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </nav>

          <p className="text-sm text-muted-foreground">
            © 2024 AutoMind. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
