import React from "react";

interface SpinnerProps {
  message: string;
}

const Spinner: React.FC<SpinnerProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-[var(--background)]/90 backdrop-blur-sm">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-[var(--border)] border-t-[var(--primary)] animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-[var(--primary)]/20"></div>
        </div>
      </div>
      <p className="text-[var(--text-secondary)] text-base mt-6 font-medium">
        {message}
      </p>
    </div>
  );
};

export default Spinner;
