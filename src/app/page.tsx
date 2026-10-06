import Link from "next/link";
import { ClassicShowcase } from "@/components/ClassicShowcase";

export default function Home() {
  return (
    <div className="wrap home-landing">
      <ClassicShowcase
        intro={
          <div className="home-intro">
            <h1>Make your <span>move.</span></h1>
            <div className="home-actions">
              <Link href="/play" className="btn btn-primary">
                Let’s play <span aria-hidden="true">↗</span>
              </Link>
              <Link href="/openings" className="home-openings">
                Explore openings <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        }
      />
      <div className="home-daily">
        <Link href="/openings">A new chess opening is added each day. <span aria-hidden="true">↗</span></Link>
      </div>
    </div>
  );
}
