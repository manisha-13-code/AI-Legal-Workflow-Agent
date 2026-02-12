const stats = [
  { value: "50K+", label: "Documents Analyzed", sublabel: "and counting" },
  { value: "99.2%", label: "Accuracy Rate", sublabel: "in risk detection" },
  { value: "< 30s", label: "Average Analysis Time", sublabel: "per document" },
  { value: "24/7", label: "Autonomous Operation", sublabel: "always working" },
];

export function StatsSection() {
  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-4">
        <div className="glass-card p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-foreground font-medium mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.sublabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
