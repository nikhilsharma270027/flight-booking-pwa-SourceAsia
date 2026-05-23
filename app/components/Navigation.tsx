"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plane, LogOut, User, Home, ChevronDown, Menu, X } from "lucide-react";
import { signOut, getSession } from "@/app/actions/auth";
import { useUserStore } from "@/lib/stores/userStore";
import { toast } from "sonner";

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const clearSession = useUserStore((state) => state.clearSession);

  const checkAuth = async () => {
    try {
      const session = await getSession();
      setIsLoggedIn(!!session);
      if (session?.email) {
        setUserEmail(session.email);
      }
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
      setShowProfileMenu(false);
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
            <span className=" sm:inline">Flight Booking</span>
          </Link>

          {/* Desktop Navigation Links */}
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

          {/* Right side: Mobile menu button + Auth */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className=" w-6 h-6 text-gray-700 z-10" />
              )}
            </button>

            {/* Auth Actions */}
            {!isLoading && (
              <>
                {isLoggedIn ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      aria-label="Toggle profile menu"
                      aria-expanded={showProfileMenu}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm font-medium">Profile</span>
                      <ChevronDown className="w-4 h-4 hidden sm:inline" />
                    </button>

                    {/* Profile Dropdown Menu */}
                    {showProfileMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm text-gray-600">Signed in as</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">{userEmail}</p>
                        </div>
                        <Link
                          href="/profile"
                          onClick={() => setShowProfileMenu(false)}
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                        >
                          <User className="w-4 h-4 inline mr-2" />
                          My Profile
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
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

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="z-10 absolute top-16 right-0 w-full md:w-auto bg-white rounded-lg shadow-lg rmd:hidden border-t border-gray-200 py-4 px-2 space-y-2">
            <Link
              href="/"
              onClick={() => setShowMobileMenu(false)}
              className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            {isLoggedIn && (
              <Link
                href="/my-bookings"
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                My Bookings
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </nav>
  );
}
