import { Target, Map, Play, GraduationCap, ArrowRight } from "lucide-react";

const steps = [
  {
    id: "goal",
    title: "Goal",
    description: "Define what you need from your document",
    icon: Target,
    color: "status-goal",
    examples: ["Identify risks", "Extract obligations", "Summarize terms"],
  },
  {
    id: "plan",
    title: "Plan",
    description: "AI agents strategize the analysis approach",
    icon: Map,
    color: "status-plan",
    examples: ["Classify document type", "Map key clauses", "Flag anomalies"],
  },
  {
    id: "act",
    title: "Act",
    description: "Execute automated workflows and actions",
    icon: Play,
    color: "status-act",
    examples: ["Draft responses", "Set reminders", "Generate reports"],
  },
  {
    id: "learn",
    title: "Learn",
    description: "Continuously improve from every interaction",
    icon: GraduationCap,
    color: "status-learn",
    examples: ["Pattern recognition", "Personalized insights", "Smart suggestions"],
  },
];

export function WorkflowSection() {
  return (
    <section id="workflow" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            The <span className="gradient-text">Autonomous</span> Framework
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlike chatbots, AutoMind proactively works through your legal documents 
            using our Goal → Plan → Act → Learn methodology.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-status-goal via-status-plan via-status-act to-status-learn hidden lg:block" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="relative animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="glass-card-hover p-6 h-full flex flex-col">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-${step.color}/10 border border-${step.color}/20 flex items-center justify-center mb-4`}>
                    <step.icon className={`h-7 w-7 text-${step.color}`} />
                  </div>

                  {/* Step number */}
                  <div className="absolute top-4 right-4 text-xs font-mono text-muted-foreground">
                    0{index + 1}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4 flex-grow">
                    {step.description}
                  </p>

                  {/* Examples */}
                  <div className="space-y-2">
                    {step.examples.map((example, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ArrowRight className={`h-3 w-3 text-${step.color}`} />
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
