import type { Metadata } from "next";
import { PublicSubjectPage } from "@/components/public-subject-page";

type Props = { params: Promise<{ slug: string }> };
export const metadata: Metadata = { title: "المادة التعليمية" };

export default async function SubjectPage({ params }: Props) {
  return <PublicSubjectPage slug={(await params).slug} />;
}
