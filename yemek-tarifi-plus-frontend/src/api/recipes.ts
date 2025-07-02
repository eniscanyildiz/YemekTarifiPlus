import axios from './axios';
import type { Recipe } from "../types/recipe";
import type { RecipeMedia } from "../types/recipe";

export interface RecipeCreateDto {
  title: string;
  ingredients: string[];
  steps: string[];
  duration: number;
  categoryId: string;
  media?: RecipeMedia[];
}

export const fetchRecipes = async (): Promise<Recipe[]> => {
  const res = await axios.get("http://localhost:7241/api/Recipes");
  return res.data;
};

export const fetchTrendingRecipes = async (limit: number = 6): Promise<Recipe[]> => {
  const res = await axios.get(`http://localhost:7241/api/Recipes/trending?limit=${limit}`);
  return res.data;
};

export const createRecipe = async (data: RecipeCreateDto) => {
  const token = localStorage.getItem('accessToken');

  const response = await axios.post("http://localhost:7241/api/Recipes", data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

export const getCategories = async () => {
  const response = await axios.get("http://localhost:7241/api/Categories");
  return response.data;
};

export const getRecipeById = async (id: string) => {
  const response = await axios.get(`http://localhost:7241/api/Recipes/${id}`);
  return response.data;
};

export const searchRecipes = async (searchTerm: string): Promise<Recipe[]> => {
  if (!searchTerm.trim()) {
    // Eğer arama terimi boşsa, tüm tarifleri getir
    return fetchRecipes();
  }
  
  // Backend'deki filter endpoint'ini kullanarak arama yap
  // searchTerm parametresi hem başlıkta hem malzemelerde arama yapar
  const response = await axios.get(`http://localhost:7241/api/Recipes/filter?searchTerm=${encodeURIComponent(searchTerm)}`);
  return response.data;
};

// Popülerlik artırma fonksiyonları
export const incrementViewCount = async (id: string, anonId?: string) => {
  if (anonId) {
    const response = await axios.post(`http://localhost:7241/api/Recipes/${id}/view`, { anonId });
    return response.data;
  } else {
    const response = await axios.post(`http://localhost:7241/api/Recipes/${id}/view`);
    return response.data;
  }
};

export const incrementLikeCount = async (id: string, anonId?: string) => {
  if (anonId) {
    const response = await axios.post(`http://localhost:7241/api/Recipes/${id}/like`, { anonId });
    return response.data;
  } else {
    const response = await axios.post(`http://localhost:7241/api/Recipes/${id}/like`);
    return response.data;
  }
};

export const incrementCommentCount = async (id: string) => {
  const response = await axios.post(`http://localhost:7241/api/Recipes/${id}/comment`);
  return response.data;
};

export const isRecipeLiked = async (id: string, anonId?: string) => {
  if (anonId) {
    const response = await axios.post(`http://localhost:7241/api/Recipes/${id}/isliked`, { anonId });
    return response.data.liked;
  } else {
    const response = await axios.post(`http://localhost:7241/api/Recipes/${id}/isliked`);
    return response.data.liked;
  }
};