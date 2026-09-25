import data from "@/data/projects.json";

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
  images: ProjectImage[];
};

export const projects: Project[] = data;
