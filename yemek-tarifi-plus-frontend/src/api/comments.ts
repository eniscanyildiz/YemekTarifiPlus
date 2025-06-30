import axios from "./axios";

export const getCommentsByRecipeId = async (recipeId: string) => {
  const response = await axios.get(`http://localhost:7207/api/comments/${recipeId}`);
  return response.data;
};

export const postComment = async (recipeId: string, content: string, token: string) => {
  const userId = localStorage.getItem("userId");
  const response = await axios.post(
    "http://localhost:7207/api/comments",
    { recipeId, content, userId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};