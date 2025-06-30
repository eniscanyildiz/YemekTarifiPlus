import axios from "./axios";

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export const registerUser = (data: RegisterRequest) => {
  return axios.post("/Users/register", data);
};

export const loginUser = (data: LoginRequest) => {
  return axios.post("/Users/login", data);
};

export const toggleFavoriteRecipe = async (recipeId: string, token: string) => {
  const res = await axios.post(
    `http://localhost:7071/api/Users/favorites/${recipeId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data as string[];
};

export const getFavorites = async (token: string) => {
  const res = await axios.get("http://localhost:7071/api/Users/favorites", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data as string[];
};