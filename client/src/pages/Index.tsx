import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { StatsSection } from "@/components/StatsSection";
import { UploadSection } from "@/components/UploadSection";
import { WorkflowSection } from "@/components/WorkflowSection";
import { FeaturesGrid } from "@/components/FeaturesGrid";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <StatsSection />
        <UploadSection />
        <WorkflowSection />
        <FeaturesGrid />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
