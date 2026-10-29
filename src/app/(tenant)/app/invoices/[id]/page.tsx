import type { Metadata } from "next";
import { DocumentPage } from "@/components/workspace/document-page";

export const metadata: Metadata = { title: "Invoice" };

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocumentPage resourceKey="invoices" documentId={id} />;
}
