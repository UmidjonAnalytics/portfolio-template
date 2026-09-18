"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import { LocaleProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "!bg-surface !text-fg !border !border-line !shadow-float !rounded-xl font-sans",
            }}
          />
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
