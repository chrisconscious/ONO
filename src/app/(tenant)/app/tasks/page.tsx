import type { Metadata } from "next";
import { ResourcePage } from "@/components/workspace/resource-page";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return <ResourcePage resourceKey="tasks" />;
}
