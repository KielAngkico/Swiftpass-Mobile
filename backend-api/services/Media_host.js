import Constants from "expo-constants";

const MEDIA_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_MEDIA_URL ||
  Constants.manifest?.extra?.EXPO_PUBLIC_MEDIA_URL;
  console.log("MEDIA_URL:", MEDIA_URL);

export const getFullPhotoUrl = (relativePath) => {
  if (!relativePath) return null;
  return `${MEDIA_URL}/${relativePath}`;
};
