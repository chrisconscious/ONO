import type { Metadata } from "next";
import { ResourcePage } from "@/components/workspace/resource-page";

export const metadata: Metadata = { title: "Support cases" };

export default function SupportCasesPage() {
  return <ResourcePage resourceKey="support-cases" />;
}
