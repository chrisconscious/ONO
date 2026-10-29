import type { Metadata } from "next";
import { ResourcePage } from "@/components/workspace/resource-page";

export const metadata: Metadata = { title: "Warehouses" };

export default function WarehousesPage() {
  return <ResourcePage resourceKey="warehouses" />;
}
