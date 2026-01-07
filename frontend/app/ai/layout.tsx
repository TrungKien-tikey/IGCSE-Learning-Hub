/**
 * AI Module Layout
 * Root layout cho AI Service module (results, insights, recommendations)
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Service - IGCSE Learning Hub",
  description: "AI-powered exam grading and analytics",
};

export default function AILayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
