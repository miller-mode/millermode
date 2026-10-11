import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionStrip } from "@/components/SectionStrip";
import { SiteChrome } from "@/components/SiteChrome";
import { projectsIn } from "@/lib/projects";
import { findSection, sections } from "@/lib/sections";


export const dynamicParams = false;

export function generateStaticParams() {
  return sections.map((section) => ({ section: section.id }));
}

export async function generateMetadata({ params }: PageProps<"/[section]">): Promise<Metadata> {
  const section = findSection((await params).section);
  if (!section) return {};
  const shoots = projectsIn(section.id);
  return {
    title: section.label,
    description: `${section.label} styling by Michael Miller: ${shoots
      .slice(0, 6)
      .map((project) => project.title.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()))
      .join(", ")}.`,
    openGraph: { images: [shoots[0].images[0].src] },
  };
}

export default async function Page({ params }: PageProps<"/[section]">) {
  const section = findSection((await params).section);
  if (!section) notFound();

  return (
    <SiteChrome>
      <SectionStrip section={section} projects={projectsIn(section.id)} />
    </SiteChrome>
  );
}
