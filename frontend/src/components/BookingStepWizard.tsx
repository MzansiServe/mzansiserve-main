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
    <div className="mb-20 w-full max-w-3xl mx-auto px-4">
      <div className="relative flex justify-between items-start w-full">
        {/* Progress Line Background */}
        <div className="absolute top-6 left-0 right-0 h-[1px] bg-slate-100 rounded-full" />
        {/* Progress Line Active */}
        <div
          className="absolute top-6 left-0 h-[1px] bg-[#222222] rounded-full transition-all duration-700 ease-in-out"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isDone = step.id < currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center flex-1 transition-all duration-500">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-700 border",
                  isActive
                    ? "bg-[#222222] text-white border-transparent shadow-2xl shadow-slate-200 scale-110"
                    : isDone
                      ? "bg-white text-emerald-500 border-emerald-100 shadow-sm"
                      : "bg-white border-slate-100 text-slate-300"
                )}
              >
                {isDone ? <Check className="h-6 w-6" strokeWidth={3} /> : step.id}
              </div>
              <span
                className={cn(
                  "mt-4 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors duration-500",
                  isActive ? "text-[#222222]" : (isDone ? "text-slate-600" : "text-slate-300")
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
