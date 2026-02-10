import { Header } from "./components/Header";
import { AgentCard } from "./components/AgentCard";
import { TaskCard } from "./components/TaskCard";
import { StepRunner } from "./components/StepRunner";
import { EventLogPanel } from "./components/EventLogPanel";
import { useDemoStore } from "./useDemoStore";

function App() {
  const {
    task,
    steps,
    events,
    requester,
    worker,
    currentStep,
    isRunning,
    isDone,
    runNextStep,
    reset,
  } = useDemoStore();

  // Determine which agent is currently active
  const activeAgent =
    currentStep > 0 && currentStep <= steps.length
      ? steps[currentStep - 1].agent
      : isRunning && currentStep < steps.length
      ? steps[currentStep].agent
      : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Agents Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <AgentCard agent={requester} isActive={activeAgent === "requester"} />
          <AgentCard agent={worker} isActive={activeAgent === "worker"} />
        </div>

        {/* Task Card */}
        <div className="mb-8">
          <TaskCard task={task} />
        </div>

        {/* Bottom: Step Runner + Event Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <StepRunner
            steps={steps}
            currentStep={currentStep}
            isRunning={isRunning}
            isDone={isDone}
            onNext={runNextStep}
            onReset={reset}
          />
          <EventLogPanel events={events} />
        </div>

        {/* Done Banner */}
        {isDone && (
          <div className="mt-8 rounded-xl border border-green-500/30 bg-green-500/5 p-6 text-center animate-slide-in">
            <p className="text-2xl mb-2">🎉</p>
            <h3 className="text-lg font-bold text-green-400">
              Hackathon MVP Complete!
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Task created → accepted → completed → confirmed → paid with MON on Monad Testnet
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-[var(--border)] py-4">
        <p className="text-center text-xs text-[var(--text-secondary)]">
          Agent Marketplace MVP • Monad Testnet (Chain ID: 10143) • Mock Mode
        </p>
      </footer>
    </div>
  );
}

export default App;
