// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

// MUI 관련 임포트
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "../src/theme";
import Providers from "@/src/components/Providers";

export const metadata: Metadata = {
  title: "free-b Admin",
  description: "스마트한 강사 관리 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <AppRouterCacheProvider>
          <Providers>
            <ThemeProvider theme={theme}>
              {/* CssBaseline은 브라우저 기본 스타일을 초기화합니다 */}
              <CssBaseline />
              {children}
            </ThemeProvider>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
