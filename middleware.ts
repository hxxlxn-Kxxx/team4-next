// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const hasSession = Boolean(accessToken || refreshToken);
  const isLoginPage = pathname.startsWith('/login');

  // 토큰이 없는데 로그인 페이지가 아닌 곳(보호 라우트)을 가려고 하면 쫓아냄!
  if (!hasSession && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 토큰이 있는데 로그인 페이지를 가려고 하면 대시보드로 튕겨냄!
  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// 미들웨어가 감시할 경로 설정 (api, 정적 파일, 이미지 등은 제외)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
