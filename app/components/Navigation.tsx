"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plane, LogOut, User, Home } from "lucide-react";
import { signOut, getSession } from "@/app/actions/auth";
import { useUserStore } from "@/lib/stores/userStore";
import { toast } from "sonner";

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const clearSession = useUserStore((state) => state.clearSession);

  const checkAuth = async () => {
    try {
      const session = await getSession();
      setIsLoggedIn(!!session);
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check auth status on component mount and when route changes
    checkAuth();
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      toast.success("Successfully logged out");
      setIsLoggedIn(false);
      clearSession();
      // Add a small delay to ensure toast is visible before redirect
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const result = await signOut();
      if (result.error) {
        toast.error(result.error);
      } else {
        // Redirect after successful sign out
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <Plane className="w-6 h-6" />
            <span className="hidden sm:inline">Flight Booking</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex gap-6 items-center">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
              Home
            </Link>
            {isLoggedIn && (
              <Link href="/my-bookings" className="text-gray-700 hover:text-blue-600 transition-colors">
                My Bookings
              </Link>
            )}
          </div>

          {/* Auth Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {!isLoading && (
              <>
                {isLoggedIn ? (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <span className="hidden sm:inline">Sign In</span>
                      <User className="w-4 h-4 sm:hidden" />
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <span className="hidden sm:inline">Sign Up</span>
                      <span className="sm:hidden">+</span>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
