import Constants from "expo-constants";

const MEDIA_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_MEDIA_URL ||
  Constants.manifest?.extra?.EXPO_PUBLIC_MEDIA_URL;

export const getFullPhotoUrl = (relativePath) => {
  if (!relativePath) return null;

  // 🔥 trim fixes hidden spaces/newlines
  const path = relativePath.trim();

  if (path.startsWith("http")) {
    return path;
  }

  const cleanPath = path.startsWith("/")
    ? path.substring(1)
    : path;

  return `${MEDIA_URL}/${cleanPath}`;
};