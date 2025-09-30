import type { Metadata } from "next";
import ThemeProvider from '@/components/ThemeProvider';
import React from 'react';
import './global.css';
import ThemeToggle from '@/components/ThemeToggle';

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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeToggle/>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
