import { useUser } from "@clerk/react";

interface UseHomeGreetingOptions {
  profileName?: string | null;
}

export function useHomeGreeting({ profileName }: UseHomeGreetingOptions = {}) {
  const { user } = useUser();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning"
    : hour < 17 ? "Good afternoon"
    : hour < 21 ? "Good evening"
    : "Good night";
  const displayName =
    profileName?.trim() ||
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    null;

  return { greeting, displayName, firstName: displayName, user };
}
