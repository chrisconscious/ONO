import type { Metadata } from "next";
import { ResourcePage } from "@/components/workspace/resource-page";

export const metadata: Metadata = { title: "Products & services" };

export default function ProductsPage() {
  return <ResourcePage resourceKey="products" />;
}
