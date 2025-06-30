import { useEffect, useState } from "react";
import { fetchRecipes } from "../api/recipes";
import type { Recipe } from "../types/recipe";
import { Link } from "react-router-dom";
import { getFavorites, toggleFavoriteRecipe } from "../api/auth";

function RecipeListPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    fetchRecipes()
      .then(setRecipes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
  const fetchFavorites = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const res = await getFavorites(token);
      setFavorites(res);
    } catch (err) {
      console.error("Favoriler alınamadı", err);
    }
  };

  fetchFavorites();
}, []);

  const handleToggleFavorite = async (id: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Favorilere eklemek için giriş yapmalısınız.");
      return;
    }

  try {
    const updatedFavorites = await toggleFavoriteRecipe(id!, token);
    setFavorites(updatedFavorites);
  } catch (err) {
    console.error("Favori güncellenemedi", err);
    alert("Favori ekleme/çıkarma başarısız.");
  }
};

  const filteredRecipes = recipes.filter((r) =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">📋 Tarif Listesi</h2>

      <input
        type="text"
        placeholder="Tarif ara..."
        className="border p-2 mb-6 w-full rounded shadow"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <p className="text-center">Yükleniyor...</p>
      ) : filteredRecipes.length === 0 ? (
        <p className="text-center text-gray-500">Hiç tarif bulunamadı.</p>
      ) : (
        <ul>
          {filteredRecipes.map((recipe) => (
            <li
              key={recipe.id}
              className="mb-4 p-4 border rounded shadow-sm hover:shadow-md transition"
            >
              <Link to={`/recipes/${recipe.id}`} className="font-semibold text-lg">{recipe.title}</Link>
              <p className="text-sm mt-1">⏱️ Süre: {recipe.duration} dk</p>
              <p className="text-sm mt-1">
                🍴 Malzemeler: {recipe.ingredients.join(", ")}
              </p>
              <button
                onClick={() => handleToggleFavorite(recipe.id)}
                className="text-sm text-blue-600 hover:underline mt-2 block"
              >
                {favorites.includes(recipe.id)
                  ? "⭐ Favoriden çıkar"
                  : "☆ Favorilere ekle"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RecipeListPage;