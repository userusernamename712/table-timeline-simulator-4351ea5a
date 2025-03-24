
import { StoredFile, UploadedData } from "@/types";

const STORAGE_KEY = "table-timeline-simulator-files";

export const saveFilesToStorage = (uploadedData: UploadedData): void => {
  try {
    const storageData = {
      reservationsFile: uploadedData.reservationsFile,
      mapsFile: uploadedData.mapsFile
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    console.error("Error saving files to storage:", error);
  }
};

export const loadFilesFromStorage = (): { 
  reservationsFile?: StoredFile, 
  mapsFile?: StoredFile 
} => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return {};
    
    return JSON.parse(storedData);
  } catch (error) {
    console.error("Error loading files from storage:", error);
    return {};
  }
};

export const clearStoredFiles = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
