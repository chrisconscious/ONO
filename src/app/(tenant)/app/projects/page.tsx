import type { Metadata } from "next";
import { ResourcePage } from "@/components/workspace/resource-page";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return <ResourcePage resourceKey="projects" />;
}
