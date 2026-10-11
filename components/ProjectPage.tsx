"use client";

import { useRouter } from "next/navigation";
import type { Project } from "@/lib/projects";
import { ProjectView } from "./ProjectView";
import { SiteChrome } from "./SiteChrome";

export function ProjectPage({ project, backHref }: { project: Project; backHref: string }) {
  const router = useRouter();

  return (
    <SiteChrome>
      <ProjectView project={project} onClose={() => router.push(backHref)} standalone />
    </SiteChrome>
  );
}
