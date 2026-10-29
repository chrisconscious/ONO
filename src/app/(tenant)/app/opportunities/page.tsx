import type { Metadata } from "next";
import { ResourcePage } from "@/components/workspace/resource-page";

export const metadata: Metadata = { title: "Opportunities" };

export default function OpportunitiesPage() {
  return <ResourcePage resourceKey="opportunities" />;
}
