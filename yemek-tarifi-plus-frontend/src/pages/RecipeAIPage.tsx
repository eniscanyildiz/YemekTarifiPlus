import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "../api/axios";
import { searchIngredients } from "../api/ai";
import RecipeCard from "../components/RecipeCard";
import type { Recipe } from "../types/recipe";

interface AIRecipe {
  title: string;
  ingredients: string;
  steps: string;
}

const RecipeAIPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [prompt, setPrompt] = useState("");
  const [aiRecipes, setAiRecipes] = useState<AIRecipe[]>([]);
  const [dbRecipes, setDbRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [authorNames, setAuthorNames] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const urlPrompt = searchParams.get('prompt');
    if (urlPrompt) {
      setPrompt(urlPrompt);
      handleSearch(urlPrompt);
    }
  }, [searchParams]);

  const handleSearch = async (searchPrompt: string) => {
    console.log('AI handleSearch başlıyor:', searchPrompt);
    if (!searchPrompt.trim()) return;
    setLoading(true);
    try {
      const ingredients = searchPrompt.split(/[,.\s]+/).filter(item => item.trim().length > 0);
      const response = await searchIngredients(ingredients);
      setAiRecipes(
        Array.isArray(response.aiRecipes)
          ? response.aiRecipes
          : Array.isArray(response)
            ? response
            : []
      );
      setDbRecipes(response.dbRecipes || []);
      const ids = Array.from(new Set(response.dbRecipes?.map((r: Recipe) => r.authorId).filter(Boolean) || [])) as string[];
      const map: { [key: string]: string } = {};
      await Promise.all(ids.map(async (id: string) => {
        try {
          const userResponse = await axios.get(`/users/${id}`);
          map[id] = `${userResponse.data.firstName} ${userResponse.data.lastName}`;
        } catch {
          map[id] = "";
        }
      }));
      setAuthorNames(map);
    } catch (error) {
      console.error("AI arama hatası:", error);
      alert("AI araması sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
      console.log('AI handleSearch bitti:', aiRecipes);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(prompt);
  };

  const aiRecipeCards: Recipe[] = aiRecipes.map((r, idx) => ({
    id: `ai-${idx}`,
    title: r.title,
    ingredients: r.ingredients
      ? r.ingredients.split(/,|\n|•|-/).map(i => i.trim()).filter(Boolean)
      : [],
    steps: r.steps
      ? r.steps.split(/\d+\.|\n|•|-/).map(s => s.trim()).filter(Boolean)
      : [],
    media: [],
    mediaUrls: [],
    category: "",
    authorId: "ai",
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    duration: 0,
    createdAt: new Date().toISOString(),
    categoryId: "",
  }));

  return (
    <div className="min-h-screen w-full flex justify-center bg-gradient-to-r from-orange-100 via-orange-200 to-orange-300 py-8">
      <div className="w-full max-w-6xl">
        <h1 className="text-3xl lg:text-4xl font-bold mb-8 text-rose-600 text-center">
          AI Yemek Tarifi Asistanı
        </h1>

        {/* AI Prompt Input */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4 max-w-4xl mx-auto">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Elinizdeki malzemeleri yazın (örn: yumurta, soğan, patates)"
              className="flex-1 p-4 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Aranıyor..." : "AI'ya Sor"}
            </button>
          </div>
        </form>

        {loading && (
          <div className="flex items-center justify-center w-full py-16">
            <div className="text-gray-500 text-lg">AI tarifleri hazırlanıyor...</div>
          </div>
        )}

        {/* AI Önerileri */}
        {aiRecipeCards.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-rose-600">🤖 AI Önerileri</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {aiRecipeCards.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  authorName="AI Asistanı"
                  isFavorite={false}
                  showFavoriteButton={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Veritabanı Tarifleri */}
        {dbRecipes.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-rose-600">
              📚 Sitemizdeki Uygun Tarifler ({dbRecipes.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {dbRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  authorName={recipe.authorId ? authorNames[recipe.authorId] : ""}
                  isFavorite={false}
                  onToggleFavorite={() => {}}
                  showFavoriteButton={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sonuç Yok */}
        {!loading && aiRecipes.length === 0 && dbRecipes.length === 0 && prompt && (
          <div className="text-center py-16">
            <div className="text-gray-500 text-lg">
              "{prompt}" için uygun tarif bulunamadı. Farklı malzemeler deneyebilirsiniz.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeAIPage; 