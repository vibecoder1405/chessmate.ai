"use client";

import * as React from "react";
import {MoonIcon, SunIcon} from "@radix-ui/react-icons";
import {useTheme} from "next-themes";

import {Button} from "@/components/ui/button";

export function ThemeToggle() {
  const {setTheme, theme} = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 transition-all dark:-rotate-90" />
      <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 transition-all dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
