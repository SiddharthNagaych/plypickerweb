// app/services/[serviceSlug]/page.tsx
import { notFound } from "next/navigation";
import ServiceClientPage from "./ServiceClientPage";

const CITY = "Pune";

export default async function ServiceDetailPage({ params }: { params: { serviceSlug: string } }) {
  const { serviceSlug } = params;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/services/${serviceSlug}?city=${CITY}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return notFound();

  const data = await res.json();
  if (!data?.service) return notFound();

  return <ServiceClientPage service={data.service} />;
}
