"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Two live destinations in M6 — Play and Openings. The Coach tab lands in M8.
const NAV = [
  { label: "Play", href: "/play" },
  { label: "Openings", href: "/openings" },
];

export function SiteHeader() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href !== "#" && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <header className="site-header">
      <div className="wrap">
        <nav className="nav" aria-label="Primary">
          <Link href="/" className="wordmark" aria-label="Chess Coach — home">
            <span className="glyph" aria-hidden="true">
              ♞
            </span>
            <span>
              Chess Coach
              <span className="name-sub">analysis deck</span>
            </span>
          </Link>

          <ul className="nav-links">
            {NAV.map((item) => (
              <li key={item.label}>
                <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <span className="nav-status" aria-hidden="true">
            <span className="dot" />
            engine online
          </span>
        </nav>
      </div>
    </header>
  );
}
