import React, { useEffect, useState } from "react";
import { fetchRecipes, getCategories } from "../api/recipes";
import type { RecipeMedia } from "../types/recipe";
import type { Recipe } from "../types/recipe";
import { Link } from "react-router-dom";

interface Category {
  id: string;
  name: string;
}

const mockTrends = [
  { id: 1, title: "Arap Tava", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80" },
  { id: 2, title: "Kabak Yemeği", image: "https://images.unsplash.com/photo-1464306076886-debca5e8a6b0?auto=format&fit=crop&w=400&q=80" },
  { id: 3, title: "Kurabiye", image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80" },
];

const HomePage = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const recipesData = await fetchRecipes();
        setRecipes(recipesData);
      } catch (err) {
        // Hata yönetimi eklenebilir
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <div className="min-h-screen w-full flex justify-center bg-gradient-to-r from-rose-100 to-orange-100">
        <div className="w-full max-w-6xl">
          {/* Hero & Arama Alanı */}
          <section className="bg-gradient-to-r from-rose-100 to-orange-100 py-8 lg:py-12 w-full">
            <div className="flex flex-col items-center w-full">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 mb-4 text-center">
                Nefis Tarifler, Pratik Lezzetler
              </h1>
              <p className="text-base lg:text-lg text-gray-600 mb-6 text-center">
                Evdeki malzemelerle harika yemekler keşfet!
              </p>
              <div className="w-full flex gap-2 justify-center max-w-xl mx-auto">
                <input
                  type="text"
                  placeholder="Malzeme veya tarif ara..."
                  className="flex-1 px-6 py-2 rounded-l border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400 text-base"
                />
                <button className="bg-rose-600 text-white px-8 py-2 rounded-r font-semibold hover:bg-rose-700 text-base">
                  Ara
                </button>
              </div>
            </div>
          </section>
      
          {/* Trend Tarifler */}
          <section className="py-6 lg:py-8 w-full">
            <h2 className="text-xl lg:text-2xl font-bold mb-4 text-rose-600">Trend Tarifler</h2>
            <div className="flex gap-4 lg:gap-6 overflow-x-auto pb-2 w-full">
              {mockTrends.map((item) => (
                <div key={item.id} className="min-w-[180px] lg:min-w-[220px] bg-white rounded-lg shadow hover:shadow-lg transition p-2">
                  <img src={item.image} alt={item.title} className="rounded-md w-full h-28 lg:h-36 object-cover mb-2" />
                  <div className="font-semibold text-gray-800 text-center text-sm lg:text-base">{item.title}</div>
                </div>
              ))}
            </div>
          </section>
      
          {/* Kategoriler */}
          <section className="py-6 lg:py-8 w-full">
            <h2 className="text-xl lg:text-2xl font-bold mb-4 text-rose-600">Kategoriler</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 w-full">
              {["🍲 Ev Yemekleri", "�� Tatlılar", "🍵 Çaylar", "☕ Kahveler"].map((item, index) => {
                const [emoji, title] = item.split(" ");
                return (
                  <div key={index} className="flex flex-col items-center bg-white rounded-lg shadow p-3 lg:p-4 hover:bg-rose-50 transition">
                    <span className="text-3xl lg:text-4xl mb-2">{emoji}</span>
                    <span className="font-medium text-gray-700 text-sm lg:text-base">{title}</span>
                  </div>
                );
              })}
            </div>
          </section>
      
          {/* Son Eklenen Tarifler */}
          <section className="py-6 lg:py-8 w-full">
            <h2 className="text-xl lg:text-2xl font-bold mb-4 text-rose-600">Son Eklenen Tarifler</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 w-full">
              {loading ? (
                <div className="col-span-3 text-center">Yükleniyor...</div>
              ) : recipes.length === 0 ? (
                <div className="col-span-3 text-center text-gray-500">Tarif bulunamadı.</div>
              ) : (
                recipes.slice(-6).reverse().map((item) => {
                  const firstMedia = item.media?.[0];
                  return (
                    <Link
                      key={item.id}
                      to={`/recipes/${item.id}`}
                      className="block bg-white rounded-lg shadow hover:shadow-2xl transition p-2 cursor-pointer group"
                      style={{ textDecoration: 'none' }}
                    >
                      {firstMedia ? (
                        firstMedia.type === "image" ? (
                          <img src={firstMedia.url} alt={item.title} className="rounded-md w-full h-28 lg:h-36 object-cover mb-2 group-hover:scale-105 transition" />
                        ) : firstMedia.type === "video" ? (
                          <video src={firstMedia.url} controls className="rounded-md w-full h-28 lg:h-36 object-cover mb-2 group-hover:scale-105 transition" />
                        ) : null
                      ) : (
                        <img src="https://placehold.co/400x200?text=Tarif" alt={item.title} className="rounded-md w-full h-28 lg:h-36 object-cover mb-2 group-hover:scale-105 transition" />
                      )}
                      <div className="font-semibold text-gray-800 text-center text-sm lg:text-base">{item.title}</div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
      <footer className="bg-white border-t py-4 text-center text-gray-500 text-sm w-full" style={{ left: 0, right: 0, position: 'relative' }}>
        © 2024 YemekTarifi+. Tüm hakları saklıdır.
      </footer>
    </>
  );
};

export default HomePage; 