import type { Metadata } from "next";
import { ResourcePage } from "@/components/workspace/resource-page";

export const metadata: Metadata = { title: "Stock movements" };

export default function StockMovementsPage() {
  return <ResourcePage resourceKey="stock-movements" />;
}
