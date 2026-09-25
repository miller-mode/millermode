import { Home } from "@/components/Home";
import { projects } from "@/lib/projects";

export default function Page() {
  return <Home projects={projects} />;
}
