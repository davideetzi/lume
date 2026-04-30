import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

export function Logo({ variant = "dark", size = "md", className }: LogoProps) {
  const wordColor = variant === "dark" ? "text-navy" : "text-white";
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-semibold tracking-tight select-none",
        sizeMap[size],
        className,
      )}
      aria-label="Humanev"
    >
      <span aria-hidden className="text-teal mr-0.5">
        *
      </span>
      <span className={wordColor}>human</span>
      <span className="text-teal">ev</span>
    </span>
  );
}
