import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectPage } from "@/components/ProjectPage";
import { findProject, projects } from "@/lib/projects";


export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const project = findProject((await params).slug);
  if (!project) return {};
  const name = project.category ? `${project.title} — ${project.category}` : project.title;
  return {
    title: name,
    description: `${name}, styled by Michael Miller. ${project.images.length} images.`,
    openGraph: { images: [project.images[0].src] },
  };
}

export default async function Page({ params }: PageProps<"/projects/[slug]">) {
  const project = findProject((await params).slug);
  if (!project) notFound();

  return <ProjectPage project={project} backHref={`/${project.section}`} />;
}
