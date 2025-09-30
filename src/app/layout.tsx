import type { Metadata } from "next";
import ThemeWrapper from '@/components/ThemeWrapper';
import React from 'react';
import './global.css';

export const metadata: Metadata = {
  title: "CoursePrettier",
  description: "CoursePrettier for ShanghaiTech University",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  );
}
