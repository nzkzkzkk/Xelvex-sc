import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineStep {
  label: string;
  timestamp?: string;
  state: "done" | "current" | "upcoming";
}

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, i) => (
        <li key={step.label} className="relative flex gap-4 pb-8 last:pb-0">
          {i < steps.length - 1 && (
            <span
              className={cn(
                "absolute left-[15px] top-8 h-full w-px",
                step.state === "done" ? "bg-primary" : "bg-border"
              )}
            />
          )}
          <span
            className={cn(
              "clip-x-sm flex h-8 w-8 shrink-0 items-center justify-center border text-xs font-bold",
              step.state === "done" && "border-primary bg-primary text-primary-foreground",
              step.state === "current" && "border-primary text-primary-strong",
              step.state === "upcoming" && "border-border text-muted-2"
            )}
          >
            {step.state === "done" ? <Check className="h-4 w-4" /> : null}
          </span>
          <div className="pt-1">
            <p
              className={cn(
                "text-sm font-medium",
                step.state === "upcoming" ? "text-muted-2" : "text-foreground"
              )}
            >
              {step.label}
            </p>
            {step.timestamp && <p className="text-xs text-muted-2">{step.timestamp}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
