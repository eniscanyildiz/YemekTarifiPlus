export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  duration: number;
  category: string;
  mediaUrls: string[];
  media?: RecipeMedia[];
  
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  popularityScore?: number;
  authorId?: string;
  createdAt?: string;
}

export interface RecipeMedia {
  url: string;
  type: "image" | "video";
}