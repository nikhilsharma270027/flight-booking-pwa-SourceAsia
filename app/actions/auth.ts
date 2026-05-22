"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getSession() {
  try {
    const supabase = await createClient();
    // Use getUser() instead of getSession() for server-side validation
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return null;
    }

    return data.user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function signUp(email: string, password: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error("Error signing up:", error);
    return { error: "Failed to sign up" };
  }
}

export async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    // Success - return without redirect, let client handle it
    return { error: null };
  } catch (error) {
    console.error("Error signing in:", error);
    return { error: "Failed to sign in" };
  }
}

export async function signOut(): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message };
    }

    // Success - return without redirect, let client handle it
    return { error: null };
  } catch (error) {
    console.error("Error signing out:", error);
    return { error: "Failed to sign out" };
  }
}
