import Link from "next/link";

const DESIGN_LINKS = [
  { href: "/design", label: "Overview" },
  { href: "/design/scoreboard", label: "Scoreboard rows" },
] as const;

export function DesignNav() {
  return (
    <nav aria-label="Design" className="design-nav section-block">
      <p className="eyebrow">Design lab</p>
      <ul className="design-nav__list">
        {DESIGN_LINKS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="design-nav__link">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
