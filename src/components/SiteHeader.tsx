import Link from "next/link";

const NAV = [
  { label: "Play", href: "/" },
  { label: "Review", href: "#" },
  { label: "Openings", href: "#" },
  { label: "Progress", href: "#" },
];

export function SiteHeader() {
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
                <Link
                  href={item.href}
                  aria-current={item.label === "Play" ? "page" : undefined}
                >
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
