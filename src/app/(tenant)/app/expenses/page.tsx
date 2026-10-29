import type { Metadata } from "next";
import { ResourcePage } from "@/components/workspace/resource-page";

export const metadata: Metadata = { title: "Expenses" };

export default function ExpensesPage() {
  return <ResourcePage resourceKey="expenses" />;
}
