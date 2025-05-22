import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the hostname from the request
  const hostname = request.headers.get('host') || request.nextUrl.hostname;

  // You can log the hostname for debugging purposes
  console.log('Current hostname:', hostname);

  // Add the hostname as a custom header to be accessible in the application
  const response = NextResponse.next();
  response.headers.set('x-hostname', hostname);

  // In the future, this middleware can be expanded to:
  // 1. Route to different layouts/pages based on hostname
  // 2. Fetch different content based on hostname
  // 3. Implement custom domain logic

  return response;
}

// Configure which paths this middleware will run on
export const config = {
  matcher: [
    // Match all paths except for:
    // - API routes (/api/*)
    // - Static files (/_next/*)
    // - Public files (/public/*)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
