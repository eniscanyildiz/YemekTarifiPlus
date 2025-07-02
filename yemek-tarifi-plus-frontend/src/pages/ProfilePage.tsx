import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import axios from "../api/axios";
import RecipeCard from "../components/RecipeCard";
import type { Recipe } from "../types/recipe";
import { getUserById } from "../api/auth";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

const ProfilePage: React.FC = () => {
  const { token, email } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorNames, setAuthorNames] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchProfile();
    fetchFavorites();
  }, []);

  useEffect(() => {
    // Favori tarifler değiştiğinde yazar adlarını çek
    const fetchAuthors = async () => {
      const ids = Array.from(new Set(favorites.map(r => r.authorId).filter(Boolean)));
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
    if (favorites.length > 0) fetchAuthors();
  }, [favorites]);

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
            const recipeResponse = await axios.get(`http://localhost:7241/api/Recipes/${recipeId}`);
            const r = recipeResponse.data;
            // media tipini RecipeMedia ile uyumlu hale getir
            const safeMedia = ((r.media || []).map((m: any) => ({
              url: m.url,
              type: m.type === "image" || m.type === "video" ? m.type as "image" | "video" : "image"
            })) as import("../types/recipe").RecipeMedia[]);
            return {
              id: r.id,
              title: r.title,
              ingredients: r.ingredients || [],
              steps: r.steps || [],
              duration: r.duration || 0,
              category: r.category || "",
              mediaUrls: r.mediaUrls || [],
              media: safeMedia,
              viewCount: r.viewCount || 0,
              likeCount: r.likeCount || 0,
              commentCount: r.commentCount || 0,
              popularityScore: r.popularityScore || 0,
              authorId: r.authorId,
              createdAt: r.createdAt,
            };
          } catch (error) {
            return null;
          }
        })
      );
      
      const validRecipes = favoriteRecipes.filter(Boolean) as Recipe[];
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
    <div className="min-h-screen bg-gradient-to-r from-orange-100 via-orange-200 to-orange-300 py-4 lg:py-8 flex justify-center">
      <div className="w-full max-w-6xl flex flex-col gap-8">
        {/* Profil Bilgileri */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center mb-4">
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
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col min-h-[300px]">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-4 lg:mb-6">Favori Tariflerim</h2>
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-12">
              <p className="text-gray-500 text-base lg:text-lg">Henüz favori tarifiniz yok.</p>
              <p className="text-gray-400 text-sm lg:text-base">Tarifleri beğenerek favorilerinize ekleyebilirsiniz.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {favorites.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  authorName={recipe.authorId ? authorNames[recipe.authorId] : ""}
                  isFavorite={true}
                  onToggleFavorite={removeFavorite}
                  showFavoriteButton={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 