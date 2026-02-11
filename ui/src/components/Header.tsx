export function Header() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏪</span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">TaskFlow</h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Ultra-Simple MVP — Agent → Agent → Payment Flow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-mono text-[var(--text-secondary)]">Monad Testnet</span>
          </div>
          <span className="text-xs text-[var(--text-secondary)] bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-mono">
            Chain ID: 10143
          </span>
        </div>
      </div>
    </header>
  );
}
