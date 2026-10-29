import type { Metadata } from "next";
import { ResourcePage } from "@/components/workspace/resource-page";

export const metadata: Metadata = { title: "Quotations" };

export default function QuotationsPage() {
  return <ResourcePage resourceKey="quotations" />;
}
