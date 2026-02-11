import { useRef } from "react";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { LiveDemo } from "./components/LiveDemo";
import { Architecture } from "./components/Architecture";
import { TechStack, Footer } from "./components/TechStackFooter";

function App() {
  const demoRef = useRef<HTMLDivElement>(null);

  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      {/* Sticky Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[var(--mon-darker)]/90 border-b border-[var(--mon-border)]">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-[var(--mon-purple-glow)]">◆</span>
            <span className="font-pixel text-[8px] text-[var(--mon-text)]">
              TASKFLOW
            </span>
          </a>
          <div className="flex items-center gap-5">
            <a
              href="#live-demo"
              className="text-[10px] text-[var(--mon-text-dim)] hover:text-[var(--mon-purple-glow)] transition-colors"
            >
              [demo]
            </a>
            <a
              href="#how-it-works"
              className="text-[10px] text-[var(--mon-text-dim)] hover:text-[var(--mon-purple-glow)] transition-colors"
            >
              [how]
            </a>
            <div className="flex items-center gap-1.5 border border-[var(--mon-border)] rounded px-2.5 py-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--mon-green)] animate-pulse" />
              <span className="text-[9px] text-[var(--mon-text-dim)]">
                monad testnet
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Sections */}
      <Hero onScrollToDemo={scrollToDemo} />

      <div id="how-it-works">
        <HowItWorks />
      </div>

      <div ref={demoRef}>
        <LiveDemo />
      </div>

      <Architecture />
      <TechStack />
      <Footer />
    </div>
  );
}

export default App;
