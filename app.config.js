import "dotenv/config";

export default {
  expo: {
    name: "Swiftpass",
    slug: "SpMobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/Final_SwiftPass_Logo.png",
    scheme: "spmobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.swiftpasstech.spmobile" 
    },
    android: {
      package: "com.swiftpasstech.spmobile", 
      adaptiveIcon: {
        foregroundImage: "./assets/images/Final_SwiftPass_Logo.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_MEDIA_URL: process.env.EXPO_PUBLIC_MEDIA_URL,
      eas: {
        projectId: "3472cbea-254f-4203-a9cc-1598d29cf7e2"
      }
    } 
  }
};
