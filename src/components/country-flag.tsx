import { resolveCountryIsoCode } from "@/lib/countries/resolve-iso-code";
import { cn } from "@/lib/utils";
import type { SVGProps } from "react";
import type { FC } from "react";
import * as FlagIcons from "country-flag-icons/react/3x2";

type FlagComponent = FC<SVGProps<SVGSVGElement>>;

type CountryFlagProps = {
  name: string;
  flagEmoji?: string;
  isoCode?: string | null;
  className?: string;
  title?: string;
};

export function CountryFlag({
  name,
  flagEmoji,
  isoCode,
  className,
  title,
}: CountryFlagProps) {
  const resolvedIso =
    isoCode ?? resolveCountryIsoCode({ name, flagEmoji }) ?? null;
  const Flag =
    resolvedIso ?
      (FlagIcons as Record<string, FlagComponent | undefined>)[resolvedIso]
    : undefined;

  if (!Flag) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-4 w-6 shrink-0 border border-stage-border/80 bg-stage-elevated",
          className,
        )}
        title={title ?? name}
      />
    );
  }

  return (
    <Flag
      aria-hidden="true"
      className={cn("h-4 w-6 shrink-0 rounded-none", className)}
    />
  );
}
