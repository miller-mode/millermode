import { site } from "@/lib/site";
import { Doodle } from "./Doodle";

export function Signature({ className }: { className?: string }) {
  return (
    <div className={["a-signature", className].filter(Boolean).join(" ")}>
      <p className="a-signature__mark" aria-label="M love M, kisses">
        <Doodle name="monogram" className="a-signature__doodle" />
        <Doodle name="comma" className="a-signature__comma" />
        <Doodle name="xxx" className="a-signature__doodle" />
      </p>
      <a className="a-label a-signature__email" href={`mailto:${site.email}`}>
        {site.email}
      </a>
    </div>
  );
}
