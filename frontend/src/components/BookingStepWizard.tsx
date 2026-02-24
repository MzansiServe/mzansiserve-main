import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  label: string;
}

interface BookingStepWizardProps {
  currentStep: number;
  step3Label?: string;
}

const BookingStepWizard = ({ currentStep, step3Label = "Confirm" }: BookingStepWizardProps) => {
  const steps: Step[] = [
    { id: 1, label: "Select Provider" },
    { id: 2, label: "Details & Time" },
    { id: 3, label: step3Label },
  ];

  return (
    <div className="mb-16 w-full max-w-3xl mx-auto px-4">
      <div className="relative flex justify-between items-start w-full">
        {/* Progress Line Background */}
        <div className="absolute top-6 left-[16%] right-[16%] h-[3px] bg-slate-200 rounded-full" />
        {/* Progress Line Active */}
        <div
          className="absolute top-6 left-[16%] h-[3px] bg-primary rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `calc(${((currentStep - 1) / (steps.length - 1)) * 68}%)` }}
        />

        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isDone = step.id < currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-base font-bold transition-all duration-500 border-[3px] shadow-sm",
                  isActive
                    ? "bg-gradient-purple text-white border-transparent shadow-glow-purple scale-110"
                    : isDone
                      ? "bg-emerald-500 text-white border-transparent shadow-md"
                      : "bg-white border-slate-200 text-slate-400"
                )}
              >
                {isDone ? <Check className="h-6 w-6" strokeWidth={3} /> : step.id}
              </div>
              <span
                className={cn(
                  "mt-4 text-sm font-medium transition-colors duration-300",
                  isActive ? "text-primary font-bold" : (isDone ? "text-slate-800" : "text-slate-400")
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingStepWizard;
