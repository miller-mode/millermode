import Link from "next/link";
import { Doodle } from "@/components/Doodle";
import { SiteChrome } from "@/components/SiteChrome";

export default function NotFound() {
  return (
    <SiteChrome>
      <div className="m-notFound">
        <Doodle name="devil" className="m-notFound__doodle" />
        <h1 className="a-h1">Not in the edit</h1>
        <p className="a-hand m-notFound__note">this page doesn’t exist</p>
        <Link href="/" className="a-label m-notFound__home">
          Back to the work
        </Link>
      </div>
    </SiteChrome>
  );
}
