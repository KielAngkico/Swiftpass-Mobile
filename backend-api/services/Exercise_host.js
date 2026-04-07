import Constants from "expo-constants";

const MEDIA_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_MEDIA_URL ||
  Constants.manifest?.extra?.EXPO_PUBLIC_MEDIA_URL;

export const getFullPhotoUrl = (relativePath) => {
  if (!relativePath) return null;
  
  const cleanPath = relativePath.startsWith('/') 
    ? relativePath.substring(1) 
    : relativePath;
  
  return `${MEDIA_URL}/${cleanPath}`;
};