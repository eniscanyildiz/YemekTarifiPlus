import { useEffect, useState, useCallback } from "react";
import { fetchRecipes, searchRecipes } from "../api/recipes";
import type { Recipe } from "../types/recipe";
import { Link, useSearchParams } from "react-router-dom";
import { getFavorites, toggleFavoriteRecipe, getUserById } from "../api/auth";
import RecipeCard from "../components/RecipeCard";

function RecipeListPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [authorNames, setAuthorNames] = useState<{ [key: string]: string }>({});
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);

  // Dinamik arama fonksiyonu
  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setLoading(true);
      try {
        const allRecipes = await fetchRecipes();
        setRecipes(allRecipes);
        setAllRecipes(allRecipes);
      } catch (error) {
        console.error("Tarifler yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
      return;
    }

    setSearchLoading(true);
    try {
      const searchResults = await searchRecipes(term);
      setRecipes(searchResults);
    } catch (error) {
      console.error("Arama yapılırken hata:", error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Arama terimi değiştiğinde arama yap
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm);
    }, 300); // 300ms gecikme ile debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, performSearch]);

  // URL'den gelen arama ve kategori parametresini kontrol et
  useEffect(() => {
    const urlSearchTerm = searchParams.get('search');
    const urlCategory = searchParams.get('category');
    if (urlSearchTerm && urlSearchTerm !== searchTerm) {
      setSearchTerm(urlSearchTerm);
    }
    if (urlCategory) {
      // Kategori filtresi varsa, tarifleri filtrele
      setRecipes((prev) => prev.filter(r => r.category && r.category.toLowerCase() === urlCategory.toLowerCase()));
    }
  }, [searchParams, searchTerm]);

  // İlk yükleme
  useEffect(() => {
    fetchRecipes()
      .then((data) => {
        setRecipes(data);
        setAllRecipes(data);
      })
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

  useEffect(() => {
    // Tarifler değiştiğinde yazar adlarını çek
    const fetchAuthors = async () => {
      const ids = Array.from(new Set(recipes.map(r => r.authorId).filter(Boolean)));
      const map: { [key: string]: string } = {};
      await Promise.all(ids.map(async (id) => {
        try {
          const user = await getUserById(id!);
          map[id!] = `${user.firstName} ${user.lastName}`;
        } catch {
          map[id!] = "";
        }
      }));
      setAuthorNames(map);
    };
    if (recipes.length > 0) fetchAuthors();
  }, [recipes]);

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

  // Artık client-side filtreleme yapmıyoruz, backend'den gelen sonuçları kullanıyoruz

  return (
    <div className="min-h-screen w-full flex justify-center bg-gradient-to-r from-orange-100 via-orange-200 to-orange-300 py-8">
      <div className="w-full max-w-6xl">
        <h2 className="text-2xl lg:text-3xl font-bold mb-8 text-rose-600 text-left">
          {searchTerm ? `Arama Sonuçları: "${searchTerm}"` : "Tüm Tarifler"}
        </h2>

        {loading || searchLoading ? (
          <div className="flex items-center justify-center w-full py-16">
            <div className="text-gray-500 text-lg">Yükleniyor...</div>
          </div>
        ) : recipes.length === 0 && searchTerm ? (
          <div className="flex flex-col justify-center w-full py-16 gap-4">
            <div className="text-gray-500 text-lg mb-2 text-left">"{searchTerm}" için hiç tarif bulunamadı.</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {allRecipes.slice(-50).reverse().map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  authorName={recipe.authorId ? authorNames[recipe.authorId] : ""}
                  isFavorite={favorites.includes(recipe.id)}
                  onToggleFavorite={handleToggleFavorite}
                  showFavoriteButton={true}
                />
              ))}
            </div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex items-center justify-center w-full py-16">
            <div className="text-gray-500 text-lg">Hiç tarif bulunamadı.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                authorName={recipe.authorId ? authorNames[recipe.authorId] : ""}
                isFavorite={favorites.includes(recipe.id)}
                onToggleFavorite={handleToggleFavorite}
                showFavoriteButton={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecipeListPage;