import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UploadSection() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file.name);
    }
  }, []);

  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Upload zone */}
          <div className="animate-fade-in">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer
                ${isDragging 
                  ? "border-primary bg-primary/5 scale-[1.02]" 
                  : "border-border hover:border-primary/50 hover:bg-card/50"
                }
              `}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />

              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Upload className={`h-10 w-10 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                </div>

                <h3 className="text-2xl font-semibold mb-2">
                  {uploadedFile ? "Document Uploaded!" : "Drop your document here"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {uploadedFile 
                    ? uploadedFile 
                    : "PDF, DOC, DOCX, or TXT — up to 50MB"
                  }
                </p>

                <Button variant={uploadedFile ? "hero" : "outline"} size="lg">
                  {uploadedFile ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Analyze Document
                    </>
                  ) : (
                    "Browse Files"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right side - Analysis preview */}
          <div className="space-y-4 animate-slide-in-right">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">
                Instant <span className="gradient-text">Intelligence</span>
              </h2>
              <p className="text-muted-foreground">
                Our AI agents work together to extract actionable insights from your legal documents.
              </p>
            </div>

            {/* Analysis cards */}
            <AnalysisCard
              icon={AlertTriangle}
              iconColor="text-amber-500"
              title="Risk Identification"
              description="3 potential risks identified in liability clause"
              status="High Priority"
              statusColor="bg-amber-500/10 text-amber-500"
            />

            <AnalysisCard
              icon={Clock}
              iconColor="text-blue-500"
              title="Key Deadlines"
              description="Response required within 14 days (March 15, 2024)"
              status="Upcoming"
              statusColor="bg-blue-500/10 text-blue-500"
            />

            <AnalysisCard
              icon={FileText}
              iconColor="text-primary"
              title="Obligations Extracted"
              description="7 contractual obligations mapped with responsible parties"
              status="Complete"
              statusColor="bg-primary/10 text-primary"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function AnalysisCard({
  icon: Icon,
  iconColor,
  title,
  description,
  status,
  statusColor,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  status: string;
  statusColor: string;
}) {
  return (
    <div className="glass-card-hover p-5 flex items-start gap-4 group">
      <div className={`w-10 h-10 rounded-xl bg-card flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="font-semibold truncate">{title}</h4>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor} shrink-0`}>
            {status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </div>
  );
}
