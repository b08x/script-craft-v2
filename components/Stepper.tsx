import React from 'react';
import { CheckIcon } from './icons/Icons';

interface StepperProps {
  steps: string[];
  currentStep: number;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            {currentStep > stepIdx + 1 ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-accent-primary" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary"
                >
                  <CheckIcon className="h-5 w-5 text-bg-primary" />
                </div>
                <span className="absolute top-10 -ml-4 w-20 text-center text-xs text-text-secondary">{step}</span>
              </>
            ) : currentStep === stepIdx + 1 ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-divider" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent-primary bg-bg-primary"
                  aria-current="step"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-accent-primary" />
                </div>
                 <span className="absolute top-10 -ml-4 w-20 text-center text-sm font-medium text-accent-primary">{step}</span>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-divider" />
                </div>
                <div
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-divider bg-bg-primary"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                </div>
                 <span className="absolute top-10 -ml-4 w-20 text-center text-xs text-text-secondary">{step}</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Stepper;