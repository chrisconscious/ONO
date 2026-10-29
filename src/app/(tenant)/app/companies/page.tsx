import type { Metadata } from "next";
import { ResourcePage } from "@/components/workspace/resource-page";

export const metadata: Metadata = { title: "Companies" };

export default function CompaniesPage() {
  return <ResourcePage resourceKey="companies" />;
}
