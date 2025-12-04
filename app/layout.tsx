import type { Metadata } from "next";
import "./globals.css";

const title = "لعبة الدودة";
const description = "لعبة دودة تفاعلية بلغة عربية.";

export const metadata: Metadata = {
  title,
  description
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
