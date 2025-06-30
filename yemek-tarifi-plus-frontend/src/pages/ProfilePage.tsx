import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import axios from "../api/axios";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  media?: Array<{
    url: string;
    type: string;
  }>;
}

const ProfilePage: React.FC = () => {
  const { token, email } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchFavorites();
  }, []);

  const fetchProfile = async () => {
    try {
      if (!token) return;
      
      // JWT'den userId'yi çıkar
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const userId = decoded.nameid || decoded.sub;
      
      const response = await axios.get(`http://localhost:7071/api/Users/${userId}`);
      setProfile(response.data);
    } catch (error) {
      console.error("Profil bilgileri alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      console.log("Favori tarifler alınıyor...");
      const response = await axios.get("http://localhost:7071/api/Users/favorites", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Favori tarif ID'leri:", response.data);
      
      // Favori tariflerin detaylarını al
      const favoriteRecipes = await Promise.all(
        response.data.map(async (recipeId: string) => {
          try {
            console.log(`Tarif ${recipeId} alınıyor...`);
            const recipeResponse = await axios.get(`http://localhost:7241/api/Recipes/${recipeId}`);
            console.log(`Tarif ${recipeId} alındı:`, recipeResponse.data);
            return recipeResponse.data;
          } catch (error) {
            console.error(`Tarif ${recipeId} alınamadı:`, error);
            return null;
          }
        })
      );
      
      const validRecipes = favoriteRecipes.filter(Boolean);
      console.log("Geçerli favori tarifler:", validRecipes);
      setFavorites(validRecipes);
    } catch (error) {
      console.error("Favoriler alınamadı:", error);
    }
  };

  const removeFavorite = async (recipeId: string) => {
    try {
      await axios.post(`http://localhost:7071/api/Users/favorites/${recipeId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(favorites.filter(fav => fav.id !== recipeId));
    } catch (error) {
      console.error("Favori kaldırılamadı:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-rose-100 to-orange-100">
        <div className="text-2xl text-rose-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-rose-100 to-orange-100 py-4 lg:py-8 flex justify-center">
      <div className="w-full max-w-md mx-auto flex flex-col gap-6">
        {/* Profil Bilgileri */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-rose-600 mb-4">Profil</h2>
          <div className="w-28 h-28 rounded-full bg-rose-200 flex items-center justify-center text-4xl font-bold text-rose-700 mb-4">
            {profile?.firstName?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || "P"}
          </div>
          <div className="text-xl font-semibold text-gray-900 mb-1">
            {profile?.firstName || "Belirtilmemiş"} {profile?.lastName || ""}
          </div>
          <div className="text-gray-500 text-base">{profile?.email}</div>
        </div>

        {/* Favori Tarifler */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-4 lg:mb-6">Favori Tariflerim</h2>
          {favorites.length === 0 ? (
            <div className="text-center py-6 lg:py-8">
              <p className="text-gray-500 text-base lg:text-lg">Henüz favori tarifiniz yok.</p>
              <p className="text-gray-400 text-sm lg:text-base">Tarifleri beğenerek favorilerinize ekleyebilirsiniz.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:gap-6">
              {favorites.map((recipe) => (
                <div key={recipe.id} className="bg-gray-50 rounded-lg p-3 lg:p-4 hover:shadow-md transition-shadow">
                  <img
                    src={recipe.media && recipe.media.length > 0 ? recipe.media[0].url : "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop"}
                    alt={recipe.title}
                    className="w-full h-32 lg:h-48 object-cover rounded-lg mb-3 lg:mb-4"
                  />
                  <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-2">{recipe.title}</h3>
                  <p className="text-gray-600 text-xs lg:text-sm mb-3 lg:mb-4 line-clamp-3">{recipe.description}</p>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => window.location.href = `/recipes/${recipe.id}`}
                      className="text-rose-600 hover:text-rose-700 font-medium text-sm lg:text-base"
                    >
                      Tarifi Gör
                    </button>
                    <button
                      onClick={() => removeFavorite(recipe.id)}
                      className="text-red-500 hover:text-red-700 text-sm lg:text-base"
                      title="Favorilerden kaldır"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 