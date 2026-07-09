import { Footer } from "@/components/layout/footer";
import { EligibilityGuard } from "@/components/layout/eligibility-guard";
import { Header } from "@/components/layout/header";
import { SkipToMain } from "@/components/layout/skip-to-main";
import { CxrScreen } from "@/features/cxr/cxr-screen";

export default function CxrPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <SkipToMain />
      <Header />
      <main id="main-content" className="mx-auto w-full max-w-flow flex-1 px-4 py-6">
        <EligibilityGuard>
          <CxrScreen />
        </EligibilityGuard>
      </main>
      <Footer />
    </div>
  );
}
