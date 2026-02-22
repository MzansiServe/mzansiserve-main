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
    { id: 1, label: "Select" },
    { id: 2, label: "Details" },
    { id: 3, label: step3Label },
  ];

  return (
    <div className="mb-12">
      <div className="flex items-center justify-center relative">
        {/* Progress Line */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-0 rounded-full">
          <div
            className="h-full bg-purple-600 transition-all duration-500 ease-in-out rounded-full"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        <div className="flex w-full max-w-2xl justify-between relative z-10">
          {steps.map((step) => {
            const isActive = step.id === currentStep;
            const isDone = step.id < currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center bg-gray-50 px-4 sm:px-8">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 shadow-lg",
                    isActive && "bg-purple-600 text-white ring-4 ring-purple-50",
                    isDone && "bg-green-500 text-white shadow-md",
                    !isActive && !isDone && "bg-gray-200 text-gray-500 shadow-none ring-0"
                  )}
                >
                  {isDone ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <span
                  className={cn(
                    "mt-2 text-sm transition-colors duration-300 whitespace-nowrap",
                    isActive ? "text-purple-900 font-semibold" : "text-gray-500 font-medium"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BookingStepWizard;
