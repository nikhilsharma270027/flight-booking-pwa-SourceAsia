"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/app/actions/auth";
import { format } from "date-fns";
import { ArrowLeft, Mail, Calendar, Shield, LogOut } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "@/app/actions/auth";
import { motion } from "framer-motion";
import { useUserStore } from "@/lib/stores/userStore";

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const clearSession = useUserStore((state) => state.clearSession);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const session = await getSession();

        if (!session) {
          toast.error("Please login to view profile");
          router.push("/auth/login");
          return;
        }

        setProfile({
          id: session.id,
          email: session.email || "",
          created_at: session.created_at || "",
          last_sign_in_at: session.last_sign_in_at || null,
        });
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      toast.success("Signing you out...");
      clearSession();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const result = await signOut();
      if (result.error) {
        toast.error(result.error);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Profile not found</p>
          <Link href="/auth/login" className="text-blue-600 hover:underline font-semibold">
            Sign in to continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account information</p>
          </div>
        </div>

        {/* Profile Card */}
        <motion.div 
          className="bg-white rounded-lg shadow-md p-4 sm:p-8 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Avatar */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-4xl text-white font-bold">
                {profile.email.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-6">
            {/* Email */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <label className="text-sm font-semibold text-gray-700">Email Address</label>
              </div>
              <p className="ml-8 text-lg text-gray-900 font-medium">{profile.email}</p>
              <p className="ml-8 text-xs text-gray-500 mt-1">Primary email associated with your account</p>
            </div>

            {/* User ID */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <label className="text-sm font-semibold text-gray-700">User ID</label>
              </div>
              <p className="ml-8 text-sm text-gray-900 font-mono bg-gray-100 p-3 rounded-lg break-all">{profile.id}</p>
            </div>

            {/* Account Created */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <label className="text-sm font-semibold text-gray-700">Account Created</label>
              </div>
              <p className="ml-8 text-gray-900 font-medium">
                {format(new Date(profile.created_at), "MMMM dd, yyyy 'at' HH:mm")}
              </p>
              <p className="ml-8 text-xs text-gray-500 mt-1">
                {format(new Date(profile.created_at), "EEEE")}
              </p>
            </div>

            {/* Last Sign In */}
            {profile.last_sign_in_at && (
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Last Sign In</label>
                <p className="ml-8 text-gray-900 font-medium">
                  {format(new Date(profile.last_sign_in_at), "MMMM dd, yyyy 'at' HH:mm")}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t pt-6 sm:pt-8 mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/my-bookings"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center font-medium"
            >
              View My Bookings
            </Link>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex-1 px-6 py-3 bg-red-100 hover:bg-red-200 disabled:bg-gray-200 text-red-700 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </button>
          </div>
        </motion.div>

        {/* Account Info Section */}
        <motion.div 
          className="bg-white rounded-lg shadow-md p-4 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Account Security</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              ✓ Your account is secured with Supabase authentication
            </p>
            <p>
              ✓ All bookings and personal data are encrypted
            </p>
            <p>
              ✓ Session automatically expires after 24 hours of inactivity
            </p>
            <p>
              ✓ Two-factor authentication can be enabled through your Supabase dashboard
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
