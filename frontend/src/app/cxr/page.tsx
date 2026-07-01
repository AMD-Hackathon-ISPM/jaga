import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { CxrScreen } from "@/features/cxr/cxr-screen";

export default function CxrPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Header />
      <main className="mx-auto w-full max-w-flow flex-1 px-4 py-6"><CxrScreen /></main>
      <Footer />
    </div>
  );
}
