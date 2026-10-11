import data from "@/data/projects.json";
import type { SectionId } from "@/lib/sections";

export type ProjectImage = {
  src: string;
  width: number;
  height: number;
};

export type Project = {
  id: number;
  slug: string;
  title: string;
  category: string;
  section: SectionId;
  images: ProjectImage[];
};

const SECTION_BY_SLUG: Record<string, SectionId> = {
  "red-carpet-personal-appearances": "red-carpet",
  "robert-aramayo-bafta-2026": "red-carpet",
  "fan-letter-short-film": "costume-design",
};

export const projects: Project[] = data.map((project) => ({
  ...project,
  section: SECTION_BY_SLUG[project.slug] ?? "editorial",
}));

export function projectsIn(section: SectionId) {
  return projects.filter((project) => project.section === section);
}

export function findProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function projectHref(project: Project) {
  return `/projects/${project.slug}`;
}

export const portrait: ProjectImage = { src: "/bio/michael-miller.jpg", width: 850, height: 1063 };
