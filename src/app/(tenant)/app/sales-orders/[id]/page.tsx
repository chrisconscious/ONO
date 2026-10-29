import type { Metadata } from "next";
import { DocumentPage } from "@/components/workspace/document-page";

export const metadata: Metadata = { title: "Sales order" };

export const dynamic = "force-dynamic";

export default async function SalesOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocumentPage resourceKey="sales-orders" documentId={id} />;
}
