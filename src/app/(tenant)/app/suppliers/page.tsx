import type { Metadata } from "next";
import { ResourcePage } from "@/components/workspace/resource-page";

export const metadata: Metadata = { title: "Suppliers" };

export default function SuppliersPage() {
  return <ResourcePage resourceKey="suppliers" />;
}
