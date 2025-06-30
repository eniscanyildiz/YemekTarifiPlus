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