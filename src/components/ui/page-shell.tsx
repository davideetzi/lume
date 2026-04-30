import { cn } from "@/lib/utils";

type PageShellProps = {
  title: string;
  intro?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
  className?: string;
};

const widthMap = {
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
};

export function PageShell({
  title,
  intro,
  children,
  maxWidth = "md",
  className,
}: PageShellProps) {
  return (
    <div className={cn("flex flex-1 flex-col bg-surface", className)}>
      <div className={cn("mx-auto w-full px-6 py-16", widthMap[maxWidth])}>
        <h1 className="text-3xl font-semibold text-navy">{title}</h1>
        {intro && (
          <p className="mt-4 max-w-2xl text-foreground-muted">{intro}</p>
        )}
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}
