import Checkmark from "./checkmark";
import Spinner from "./spinner";

interface Step {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  error?: string;
}

interface ProgressStepsProps {
  steps: Step[];
}

export default function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-3">
            {/* Step indicator */}
            <div className="flex-shrink-0">
              {step.status === 'completed' && <Checkmark />}
              {step.status === 'loading' && (
                <div className="w-6 h-6">
                  <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              {step.status === 'pending' && (
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white" />
              )}
              {step.status === 'error' && (
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              )}
            </div>

            {/* Step content */}
            <div className="flex-grow">
              <p className={`
                ${step.status === 'completed' ? 'text-green-600 font-medium' : ''}
                ${step.status === 'loading' ? 'text-blue-600 font-medium' : ''}
                ${step.status === 'pending' ? 'text-gray-400' : ''}
                ${step.status === 'error' ? 'text-red-600 font-medium' : ''}
              `}>
                {step.label}
              </p>
              {step.error && (
                <p className="text-sm text-red-500 mt-1">{step.error}</p>
              )}
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="absolute left-3 top-10 w-0.5 h-8 bg-gray-300" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}