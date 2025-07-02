import React, { useEffect, useState, useCallback } from "react";
import { fetchRecipes, getCategories, fetchTrendingRecipes, searchRecipes } from "../api/recipes";
import { getUserById } from "../api/auth";
import type { RecipeMedia } from "../types/recipe";
import type { Recipe } from "../types/recipe";
import { Link, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from "axios";

interface Category {
  id: string;
  name: string;
}

const HomePage = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [trendingAuthors, setTrendingAuthors] = useState<{ [key: string]: string }>({});
  const [latestAuthors, setLatestAuthors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();
  const trendingScrollRef = React.useRef<HTMLDivElement>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiMatchedRecipes, setAiMatchedRecipes] = useState<Recipe[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dinamik arama fonksiyonu
  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchRecipes(term);
      setSearchResults(results);
      setShowSearchResults(true);
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setTrendingLoading(true);
      try {
        const [recipesData, trendingData] = await Promise.all([
          fetchRecipes(),
          fetchTrendingRecipes(6)
        ]);
        setRecipes(recipesData);
        setTrendingRecipes(trendingData);
        // Author ad-soyadlarını çek (trend ve son eklenenler için birleştir)
        const allAuthorIds = Array.from(new Set([
          ...trendingData.map(r => r.authorId),
          ...recipesData.slice(-50).map(r => r.authorId)
        ].filter(Boolean)));
        const authorMap: { [key: string]: string } = {};
        await Promise.all(allAuthorIds.map(async (id) => {
          try {
            const user = await getUserById(id!);
            authorMap[id!] = `${user.firstName} ${user.lastName}`;
          } catch {
            authorMap[id!] = "";
          }
        }));
        setTrendingAuthors(authorMap); // trend kartlar için
        setLatestAuthors(authorMap);   // son eklenenler için
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
        setTrendingLoading(false);
      }
    };
    fetchData();
  }, []);

  const scrollTrending = (dir: "left" | "right") => {
    const el = trendingScrollRef.current;
    if (!el) return;
    const scrollAmount = 300;
    el.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };

  const handleAiSuggest = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiMatchedRecipes([]);
    setAiSuggestions([]);
    try {
      const res = await axios.post("/api/AI/suggest", { prompt: aiPrompt });
      setAiMatchedRecipes(res.data.matchedRecipes || []);
      setAiSuggestions(res.data.spoonacularSuggestions || []);
    } catch (err: any) {
      setAiError(err?.response?.data?.message || "Bir hata oluştu.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen w-full flex justify-center bg-gradient-to-r from-orange-100 via-orange-200 to-orange-300">
        <div className="w-full max-w-6xl">
          {/* Hero & Arama Alanı */}
          <section className="py-8 lg:py-12 w-full">
            <div className="flex flex-col items-center w-full">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-800 mb-4 text-center">
                Nefis Tarifler, Pratik Lezzetler
              </h1>
              <p className="text-base lg:text-lg text-gray-600 mb-6 text-center">
                Evdeki malzemelerle harika yemekler keşfet!
              </p>
              <div className="w-full flex justify-center mb-6">
                <div className="bg-white/80 border border-orange-200 rounded-xl shadow p-4 max-w-xl w-full flex flex-col items-center">
                  <span className="text-orange-500 font-bold mb-2">🤖 Tarifim.com AI Asistanı</span>
                  <div className="flex flex-col gap-2 w-full items-center">
                    <input
                      type="text"
                      className="border rounded px-3 py-2 w-full"
                      placeholder="Elimde şunlar var... (örn: yumurta, peynir, domates)"
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleAiSuggest(); }}
                    />
                    <button
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded w-full"
                      onClick={handleAiSuggest}
                      disabled={aiLoading || !aiPrompt.trim()}
                    >
                      {aiLoading ? "Yükleniyor..." : "Neler Yapabilirim?"}
                    </button>
                  </div>
                  <div className="mt-4 w-full">
                    {aiError && <div className="text-red-500 mb-2">{aiError}</div>}
                    {aiMatchedRecipes.length > 0 && (
                      <div className="mb-4">
                        <div className="font-bold text-orange-600 mb-1">Sitedeki Benzer Tarifler</div>
                        <ul className="list-disc pl-5">
                          {aiMatchedRecipes.map(r => (
                            <li key={r.id}>
                              <Link to={`/recipes/${r.id}`} className="text-blue-600 hover:underline">{r.title}</Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiSuggestions.length > 0 && (
                      <div>
                        <div className="font-bold text-orange-600 mb-1">AI (Spoonacular) Önerileri</div>
                        <ul className="list-disc pl-5">
                          {aiSuggestions.map((s, i) => (
                            <li key={s.id || i} className="flex items-center gap-2">
                              {s.image && <img src={s.image} alt={s.title} className="w-10 h-10 object-cover rounded" />}
                              <span>{s.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
      
          {/* Trend Tarifler */}
          <section className="py-6 lg:py-8 w-full relative">
            <h2 className="text-xl lg:text-2xl font-bold mb-4 text-rose-600 text-left">Trend Tarifler</h2>
            <div className="relative">
              {/* Sol ok */}
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/60 hover:bg-white/90 rounded-full shadow p-2 flex items-center justify-center transition opacity-80 hover:opacity-100"
                style={{ display: trendingRecipes.length > 2 ? 'flex' : 'none' }}
                onClick={() => scrollTrending("left")}
                aria-label="Sola kaydır"
              >
                <FaChevronLeft className="text-2xl text-orange-400" />
              </button>
              {/* Scrollable alan */}
              <div
                ref={trendingScrollRef}
                className="flex gap-4 lg:gap-6 overflow-x-auto pb-2 w-full scrollbar-none scroll-smooth"
                style={{ scrollBehavior: 'smooth' }}
              >
                {trendingLoading ? (
                  <div className="flex items-center justify-center w-full py-8">
                    <div className="text-gray-500">Trend tarifler yükleniyor...</div>
                  </div>
                ) : trendingRecipes.length === 0 ? (
                  <div className="flex items-center justify-center w-full py-8">
                    <div className="text-gray-500">Henüz trend tarif bulunmuyor.</div>
                  </div>
                ) : (
                  trendingRecipes.map((item) => {
                    const firstMedia = item.media?.[0];
                    const authorName = item.authorId ? trendingAuthors[item.authorId] : "";
                    return (
                      <Link
                        key={item.id}
                        to={`/recipes/${item.id}`}
                        className="min-w-[220px] lg:min-w-[280px] bg-white rounded-xl shadow hover:shadow-2xl transition p-4 cursor-pointer group flex flex-col"
                        style={{ textDecoration: 'none' }}
                      >
                        {firstMedia ? (
                          firstMedia.type === "image" ? (
                            <img src={firstMedia.url} alt={item.title} className="rounded-md w-full h-40 lg:h-52 object-cover mb-3 group-hover:scale-105 transition" />
                          ) : firstMedia.type === "video" ? (
                            <video src={firstMedia.url} controls className="rounded-md w-full h-40 lg:h-52 object-cover mb-3 group-hover:scale-105 transition" />
                          ) : null
                        ) : (
                          <img src="https://placehold.co/400x200?text=Tarif" alt={item.title} className="rounded-md w-full h-40 lg:h-52 object-cover mb-3 group-hover:scale-105 transition" />
                        )}
                        <div className="font-bold text-gray-800 text-lg lg:text-xl text-left mb-2">{item.title}</div>
                        <div className="border-t border-gray-200 my-2"></div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          {authorName && <span className="font-medium text-rose-600 truncate max-w-[100px] text-left">{authorName}</span>}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>👁️ {item.viewCount || 0}</span>
                            <span>❤️ {item.likeCount || 0}</span>
                            <span>💬 {item.commentCount || 0}</span>
                            <span>⏱️ {item.duration} dk</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
              {/* Sağ ok */}
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/60 hover:bg-white/90 rounded-full shadow p-2 flex items-center justify-center transition opacity-80 hover:opacity-100"
                style={{ display: trendingRecipes.length > 2 ? 'flex' : 'none' }}
                onClick={() => scrollTrending("right")}
                aria-label="Sağa kaydır"
              >
                <FaChevronRight className="text-2xl text-orange-400" />
              </button>
            </div>
          </section>
      
          {/* Kategoriler */}
          <section className="py-6 lg:py-8 w-full">
            <h2 className="text-xl lg:text-2xl font-bold mb-4 text-rose-600 text-left">Kategoriler</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 w-full">
              {[
                "🍲 Yemekler",
                "🍰 Tatlılar",
                "🍵 Çaylar",
                "☕ Kahveler"
              ].map((item, index) => {
                const [emoji, title] = item.split(" ");
                return (
                  <Link
                    key={index}
                    to={`/recipes?category=${encodeURIComponent(title)}`}
                    className="flex flex-col items-center bg-white rounded-lg shadow p-3 lg:p-4 hover:bg-rose-50 transition cursor-pointer"
                    style={{ textDecoration: 'none' }}
                  >
                    <span className="text-3xl lg:text-4xl mb-2">{emoji}</span>
                    <span className="font-medium text-gray-700 text-sm lg:text-base">{title}</span>
                  </Link>
                );
              })}
            </div>
          </section>
      
          {/* Son Eklenen Tarifler */}
          <section className="py-6 lg:py-8 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 w-full">
              {loading ? (
                <div className="col-span-3 text-center">Yükleniyor...</div>
              ) : recipes.length === 0 ? (
                <div className="col-span-3 text-center text-gray-500">Tarif bulunamadı.</div>
              ) : (
                recipes.slice(-50).reverse().map((item) => {
                  const firstMedia = item.media?.[0];
                  const authorName = item.authorId ? latestAuthors[item.authorId] : "";
                  return (
                    <Link
                      key={item.id}
                      to={`/recipes/${item.id}`}
                      className="min-w-[220px] lg:min-w-[280px] bg-white rounded-xl shadow hover:shadow-2xl transition p-4 cursor-pointer group flex flex-col"
                      style={{ textDecoration: 'none' }}
                    >
                      {firstMedia ? (
                        firstMedia.type === "image" ? (
                          <img src={firstMedia.url} alt={item.title} className="rounded-md w-full h-40 lg:h-52 object-cover mb-3 group-hover:scale-105 transition" />
                        ) : firstMedia.type === "video" ? (
                          <video src={firstMedia.url} controls className="rounded-md w-full h-40 lg:h-52 object-cover mb-3 group-hover:scale-105 transition" />
                        ) : null
                      ) : (
                        <img src="https://placehold.co/400x200?text=Tarif" alt={item.title} className="rounded-md w-full h-40 lg:h-52 object-cover mb-3 group-hover:scale-105 transition" />
                      )}
                      <div className="font-bold text-gray-800 text-lg lg:text-xl text-left mb-2">{item.title}</div>
                      <div className="border-t border-gray-200 my-2"></div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        {authorName && <span className="font-medium text-rose-600 truncate max-w-[100px] text-left">{authorName}</span>}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>👁️ {item.viewCount || 0}</span>
                          <span>❤️ {item.likeCount || 0}</span>
                          <span>💬 {item.commentCount || 0}</span>
                          <span>⏱️ {item.duration} dk</span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default HomePage; 