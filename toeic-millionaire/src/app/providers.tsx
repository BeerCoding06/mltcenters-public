"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { LanguageToggleFixed } from "@/components/LanguageToggle";
import { Toaster } from "@/components/ui/toast";
import { GameLangProvider } from "@/features/i18n/GameLangProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <GameLangProvider>
          <Toaster>
            {children}
            <LanguageToggleFixed />
          </Toaster>
        </GameLangProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
