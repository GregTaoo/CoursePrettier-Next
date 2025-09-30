"use client"

import * as React from "react"
import { Moon, Sun, Computer } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 避免 SSR 和 Hydration 不一致
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  return (
    <div className="fixed bottom-4 right-4">
      <Button variant="outline" onClick={cycleTheme} className="hover:cursor-pointer">
        {theme === "system" && <Computer/>}
        {theme === "light" && <Sun/>}
        {theme === "dark" && <Moon/>}
      </Button>
    </div>
  );
}
