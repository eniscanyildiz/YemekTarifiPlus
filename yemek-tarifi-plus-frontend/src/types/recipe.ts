export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  duration: number;
  category: string;
  mediaUrls: string[];
  media?: RecipeMedia[];
}

export interface RecipeMedia {
  url: string;
  type: "image" | "video";
}