import type { Metadata } from "next";
import { ResourcePage } from "@/components/workspace/resource-page";

export const metadata: Metadata = { title: "Sales orders" };

export default function SalesOrdersPage() {
  return <ResourcePage resourceKey="sales-orders" />;
}
