"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { SiteNavbar } from "@/components/SiteNavbar";
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
            <div className="flex min-h-full flex-1 flex-col">
              <SiteNavbar />
              <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            </div>
          </Toaster>
        </GameLangProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
