import type { Metadata } from "next";
import { ResourcePage } from "@/components/workspace/resource-page";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage() {
  return <ResourcePage resourceKey="leads" />;
}
