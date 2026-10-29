import type { Metadata } from "next";
import { ResourcePage } from "@/components/workspace/resource-page";

export const metadata: Metadata = { title: "Invoices" };

export default function InvoicesPage() {
  return <ResourcePage resourceKey="invoices" />;
}
