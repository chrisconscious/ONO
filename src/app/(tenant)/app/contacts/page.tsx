import type { Metadata } from "next";
import { ResourcePage } from "@/components/workspace/resource-page";

export const metadata: Metadata = { title: "Contacts" };

export default function ContactsPage() {
  return <ResourcePage resourceKey="contacts" />;
}
