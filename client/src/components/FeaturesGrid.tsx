import { 
  FileSearch, 
  AlertCircle, 
  Calendar, 
  MessageSquare, 
  Database, 
  Shield,
  Workflow,
  Lightbulb
} from "lucide-react";

const features = [
  {
    icon: FileSearch,
    title: "Document Classification",
    description: "Automatically identifies contract types, clauses, and document structure using multiple AI agents.",
  },
  {
    icon: AlertCircle,
    title: "Risk Detection",
    description: "Surfaces potential liabilities, unfavorable terms, and compliance issues before they become problems.",
  },
  {
    icon: Calendar,
    title: "Deadline Tracking",
    description: "Extracts and monitors all time-sensitive obligations with automatic reminder workflows.",
  },
  {
    icon: MessageSquare,
    title: "Smart Drafting",
    description: "Generates response drafts, amendments, and counter-proposals based on your document context.",
  },
  {
    icon: Database,
    title: "Vector Memory",
    description: "Stores all interactions in a vector database, enabling continuous learning and smarter recommendations.",
  },
  {
    icon: Shield,
    title: "Compliance Checks",
    description: "Validates documents against regulatory requirements and industry standards automatically.",
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    description: "Triggers actions like notifications, approvals, and integrations based on document insights.",
  },
  {
    icon: Lightbulb,
    title: "Proactive Insights",
    description: "Surfaces opportunities and recommendations you didn't know to ask for based on past patterns.",
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Autonomous <span className="gradient-text">Capabilities</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A multi-agent system that handles the complexity of legal documents 
            so you can focus on decisions, not paperwork.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card-hover p-6 animate-fade-in group"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
