import axios from "./axios";
import type { RecipeMedia } from "../types/recipe";

export const uploadMedia = async (files: File[]): Promise<RecipeMedia[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await axios.post("http://localhost:7208/api/Media/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data.medias as RecipeMedia[];
};