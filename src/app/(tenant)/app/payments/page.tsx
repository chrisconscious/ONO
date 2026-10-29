import type { Metadata } from "next";
import { ResourcePage } from "@/components/workspace/resource-page";

export const metadata: Metadata = { title: "Payments" };

export default function PaymentsPage() {
  return <ResourcePage resourceKey="payments" />;
}
