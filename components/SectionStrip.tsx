import { projectHref } from "@/lib/projects";
import type { Project } from "@/lib/projects";
import type { Section } from "@/lib/sections";
import { Filmstrip } from "./Filmstrip";

export function SectionStrip({ section, projects }: { section: Section; projects: Project[] }) {
  return (
    <Filmstrip
      title={section.label}
      note={`${projects.length} ${projects.length === 1 ? "shoot" : "shoots"}`}
      items={projects.map((project) => ({
        key: project.slug,
        image: project.images[0],
        alt: `${project.title}${project.category ? `, ${project.category}` : ""}`,
        href: projectHref(project),
        name: project.title,
      }))}
      contact
      standalone
    />
  );
}
