import type { Project } from "@/lib/projects";
import { Filmstrip } from "./Filmstrip";

type ProjectViewProps = {
  project: Project;
  onClose: () => void;
  standalone?: boolean;
};

export function ProjectView({ project, onClose, standalone = false }: ProjectViewProps) {
  const credit = `${project.title}${project.category ? ` for ${project.category}` : ""}`;

  return (
    <Filmstrip
      title={project.title}
      note={project.category}
      items={project.images.map((image, index) => ({
        key: image.src,
        image,
        alt: `${credit}, image ${index + 1}`,
      }))}
      contact={standalone}
      onClose={onClose}
      standalone={standalone}
    />
  );
}
