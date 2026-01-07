interface Step {
  id: string;
  label: string;
  status: "pending" | "loading" | "completed" | "error";
  error?: string;
}

interface ProgressStepsProps {
  steps: Step[];
}

export default function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-[15px] top-6 bottom-6 w-0.5 bg-[var(--border)]" />

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="relative flex items-start gap-4">
              {/* Step indicator */}
              <div className="relative z-10 flex-shrink-0">
                {step.status === "completed" && (
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
                {step.status === "loading" && (
                  <div className="w-8 h-8 rounded-full bg-[var(--surface)] border-2 border-[var(--primary)] flex items-center justify-center pulse-glow">
                    <div className="w-3 h-3 rounded-full bg-[var(--primary)] animate-pulse" />
                  </div>
                )}
                {step.status === "pending" && (
                  <div className="w-8 h-8 rounded-full bg-[var(--surface)] border-2 border-[var(--border)] flex items-center justify-center">
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                      {index + 1}
                    </span>
                  </div>
                )}
                {step.status === "error" && (
                  <div className="w-8 h-8 rounded-full bg-[var(--error)] flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Step content */}
              <div className="flex-grow pt-1">
                <p
                  className={`text-sm font-medium ${
                    step.status === "completed"
                      ? "text-[var(--primary)]"
                      : step.status === "loading"
                      ? "text-white"
                      : step.status === "error"
                      ? "text-[var(--error)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {step.label}
                </p>
                {step.error && (
                  <p className="text-sm text-[var(--error)] mt-1">
                    {step.error}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
