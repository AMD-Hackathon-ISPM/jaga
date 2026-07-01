import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { CxrResultScreen } from "@/features/cxr/cxr-result-screen";

export default function CxrResultPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Header />
      <main className="mx-auto w-full max-w-flow flex-1 px-4 py-6"><CxrResultScreen /></main>
      <Footer />
    </div>
  );
}
