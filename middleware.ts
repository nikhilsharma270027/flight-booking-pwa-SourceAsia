import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Authentication protection has been moved to app/(protected)/layout.tsx
// This middleware file is maintained for backward compatibility but is deprecated in Next.js 16+
export function middleware(request: NextRequest) {
  // Pass through - all route protection is now handled by layout components
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
