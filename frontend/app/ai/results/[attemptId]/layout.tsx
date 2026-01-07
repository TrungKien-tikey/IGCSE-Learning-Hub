/**
 * Results Layout
 * Layout cho trang xem kết quả chi tiết
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kết quả chấm điểm - IGCSE Learning Hub",
  description: "Xem chi tiết kết quả chấm điểm do AI Service cung cấp",
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
