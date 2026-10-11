import type { Metadata } from "next";
import { BioStrip } from "@/components/BioStrip";
import { SiteChrome } from "@/components/SiteChrome";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bio",
  description: `${site.fullName}, ${site.role.toLowerCase()}. Talent includes ${site.talent.slice(0, 6).join(", ")}.`,
  openGraph: { images: ["/bio/michael-miller.jpg"] },
};

export default function Page() {
  return (
    <SiteChrome>
      <BioStrip />
    </SiteChrome>
  );
}
