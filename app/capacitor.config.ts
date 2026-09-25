import type { CapacitorConfig } from "@capacitor/cli";

/* Ten Talents Academy — native shell (iOS / Android).
   The shell loads the live web app (server.url) so every release of the app reaches
   store users instantly; native plugins add haptics, share sheet, splash and status bar.
   The user agent carries "TenTalentsApp" so the app hides in-app purchase of membership
   (Apple guideline 3.1.1 — membership is bought on the web) and the server refuses it.
   Build: `npx cap sync` then open ios/ (Xcode) or android/ (Android Studio), or use a
   cloud build service. Change server.url to a custom domain when one is chosen. */
const config: CapacitorConfig = {
  appId: "com.tentalents.academy",
  appName: "Ten Talents",
  webDir: "www",
  server: {
    url: "https://tentalents-bank.vercel.app",
    cleartext: false,
  },
  appendUserAgent: "TenTalentsApp/1.0",
  backgroundColor: "#011936",
  ios: { contentInset: "automatic", scheme: "Ten Talents", backgroundColor: "#011936", preferredContentMode: "mobile" },
  android: { backgroundColor: "#011936", allowMixedContent: false },
  plugins: {
    SplashScreen: { launchShowDuration: 900, launchAutoHide: true, backgroundColor: "#011936", showSpinner: false, androidScaleType: "CENTER_CROP", splashFullScreen: true, splashImmersive: true },
    StatusBar: { style: "DARK", backgroundColor: "#011936", overlaysWebView: true },
  },
};

export default config;
