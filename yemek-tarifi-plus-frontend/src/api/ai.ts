import axios from "axios";

const aiInstance = axios.create({
  baseURL: "http://localhost:7241/api", // RecipeService adresi
  headers: {
    "Content-Type": "application/json"
  }
});

export const searchIngredients = async (ingredients: string[]) => {
  const response = await aiInstance.post("/ai/ingredient-search", {
    ingredients: ingredients
  });
  return response.data;
};

export default aiInstance; 