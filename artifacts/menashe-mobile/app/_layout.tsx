import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { ClerkLoaded, ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@/lib/clerkTokenCache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";
import { LanguageProvider } from "@/context/LanguageContext";

if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync();
}

const queryClient = new QueryClient();
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  // On web/browser, @expo-google-fonts uses fontfaceobserver which throws an
  // uncaught error after its 6 000 ms timeout. Pass an empty map on web so
  // useFonts resolves immediately; the browser will use the system Inter font.
  const [fontsLoaded, fontError] = useFonts(
    Platform.OS === "web"
      ? {}
      : { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold },
  );

  useEffect(() => {
    if (Platform.OS !== "web" && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (Platform.OS !== "web" && !fontsLoaded && !fontError) return null;

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <SafeAreaProvider>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <AppProvider>
                  <LanguageProvider>
                    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
                      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
                      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
                      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="torah-tracker" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="siddur" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="daf-yomi" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="mussar" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="yahrzeit-calc" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="prayer-board" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="translation-editor" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="premium" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="sacred-wisdom" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="census/index" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="census/family-head" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="census/family-members" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="census/review" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="census/submit" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="census/success" options={{ headerShown: false, animation: "fade" }} />
                      <Stack.Screen name="community/announcements" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="community/memorials" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="community/events" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="community/learning-groups" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="community/learning-detail/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="community/synagogues" options={{ headerShown: false, animation: "slide_from_right" }} />
                      <Stack.Screen name="profile/edit" options={{ headerShown: true, animation: "slide_from_right" }} />
                    </Stack>
                  </LanguageProvider>
                </AppProvider>
              </GestureHandlerRootView>
            </QueryClientProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
