import { LanguageProvider } from '@/contexts/LanguageContext';
import HeroSection from '@/components/HeroSection';
import WorksExplorer from '@/components/WorksExplorer';
import Footer from '@/components/Footer';

export default function Index() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background text-foreground">
        <main>
          <HeroSection />
          <WorksExplorer />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
