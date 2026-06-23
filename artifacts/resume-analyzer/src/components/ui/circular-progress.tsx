import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showText?: boolean;
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  showText = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeValue = Math.min(Math.max(value, 0), max);
  const percent = safeValue / max;
  const offset = circumference - percent * circumference;

  let colorClass = "text-primary";
  if (percent < 0.5) colorClass = "text-destructive";
  else if (percent < 0.75) colorClass = "text-yellow-500";
  else if (percent >= 0.9) colorClass = "text-green-500";

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          className="text-muted/30 stroke-current"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn("stroke-current transition-all duration-1000 ease-in-out", colorClass)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-3xl font-bold font-mono tracking-tighter">
            {safeValue}
          </span>
        </div>
      )}
    </div>
  );
}
