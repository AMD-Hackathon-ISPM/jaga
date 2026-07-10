import { Footer } from "@/components/layout/footer";
import { EligibilityGuard } from "@/components/layout/eligibility-guard";
import { Header } from "@/components/layout/header";
import { SkipToMain } from "@/components/layout/skip-to-main";
import { CxrResultScreen } from "@/features/cxr/cxr-result-screen";

export default function CxrResultPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <SkipToMain />
      <Header wide />
      <main
        id="main-content"
        className="mx-auto w-full max-w-flow flex-1 px-4 py-6 min-[840px]:max-w-flow-wide lg:px-6 lg:py-10"
      >
        <EligibilityGuard>
          <CxrResultScreen />
        </EligibilityGuard>
      </main>
      <Footer wide />
    </div>
  );
}
