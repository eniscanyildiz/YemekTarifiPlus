import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getRecipeById, incrementViewCount, incrementLikeCount, isRecipeLiked, fetchTrendingRecipes, fetchRecipes } from "../api/recipes";
import { getCommentsByRecipeId, postComment } from "../api/comments";
import { getFavorites, toggleFavoriteRecipe } from "../api/auth";
import type { RecipeMedia } from "../types/recipe";
import { Link } from "react-router-dom";

interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  duration: number;
  category: string;
  media?: RecipeMedia[];
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  popularityScore?: number;
  createdAt?: string;
}

interface Comment {
  content: string;
  createdAt: string;
  userName?: string;
}

function getOrCreateAnonId() {
  let anonId = localStorage.getItem("anonId");
  if (!anonId) {
    anonId = crypto.randomUUID();
    localStorage.setItem("anonId", anonId);
  }
  return anonId;
}

function markRecipeViewed(recipeId: string) {
  let viewed = JSON.parse(localStorage.getItem("viewedRecipes") || "[]");
  if (!viewed.includes(recipeId)) {
    viewed.push(recipeId);
    localStorage.setItem("viewedRecipes", JSON.stringify(viewed));
  }
}

function hasViewedRecipe(recipeId: string) {
  let viewed = JSON.parse(localStorage.getItem("viewedRecipes") || "[]");
  return viewed.includes(recipeId);
}

function markRecipeLiked(recipeId: string) {
  let liked = JSON.parse(localStorage.getItem("likedRecipes") || "[]");
  if (!liked.includes(recipeId)) {
    liked.push(recipeId);
    localStorage.setItem("likedRecipes", JSON.stringify(liked));
  }
}

function hasLikedRecipe(recipeId: string) {
  let liked = JSON.parse(localStorage.getItem("likedRecipes") || "[]");
  return liked.includes(recipeId);
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [trendingRecipes, setTrendingRecipes] = useState<Recipe[]>([]);
  const [latestRecipes, setLatestRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem("accessToken");
    if (token) {
      (async () => {
        try {
          const liked = await isRecipeLiked(id);
          setIsLiked(liked);
        } catch (err) {
        }
      })();
    } else {
      if (hasLikedRecipe(id)) {
        setIsLiked(true);
      }
    }

    const fetchData = async () => {
      const data = await getRecipeById(id);
      setRecipe(data);

      const cmts = await getCommentsByRecipeId(id);
      setComments(cmts);

      if (token) {
        try {
          await incrementViewCount(id);
          const updatedData = await getRecipeById(id);
          setRecipe(updatedData);
        } catch (err) {
          console.error("Görüntüleme sayısı artırılamadı:", err);
        }
      } else {
        if (!hasViewedRecipe(id)) {
          const anonId = getOrCreateAnonId();
          try {
            await incrementViewCount(id, anonId);
            markRecipeViewed(id);
            const updatedData = await getRecipeById(id);
            setRecipe(updatedData);
          } catch (err) {
            console.error("Görüntüleme sayısı artırılamadı:", err);
          }
        }
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const res = await getFavorites(token);
        setFavoriteIds(res);
      } catch (err) {
        console.error("Favoriler alınamadı", err);
      }
    };

    fetchFavorites();
  }, []);

  useEffect(() => {
    fetchTrendingRecipes(5).then(setTrendingRecipes).catch(() => setTrendingRecipes([]));
    fetchRecipes().then((all) => {
      const sorted = [...all].sort((a, b) => (b.createdAt && a.createdAt ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : 0));
      setLatestRecipes(sorted.slice(0, 5));
    }).catch(() => setLatestRecipes([]));
  }, []);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("Giriş yapmanız gerekiyor.");
        setSubmitting(false);
        return;
      }

      await postComment(id!, newComment, token);

      setComments((prev) => [
        ...prev,
        {
          content: newComment,
          createdAt: new Date().toISOString(),
        },
      ]);

      setNewComment("");
    } catch (err) {
      console.error(err);
      alert("Yorum eklenemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFavorite = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Favorilere eklemek için giriş yapmalısınız.");
      return;
    }

    try {
      const updatedFavorites = await toggleFavoriteRecipe(id!, token);
      setFavoriteIds(updatedFavorites);
    } catch (err) {
      console.error("Favori güncellenemedi", err);
      alert("Favori ekleme/çıkarma başarısız.");
    }
  };

  const handleLike = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      if (hasLikedRecipe(id!)) {
        alert("Bu tarife zaten beğeni verdiniz.");
        return;
      }
      const anonId = getOrCreateAnonId();
      try {
        await incrementLikeCount(id!, anonId);
        setIsLiked(true);
        markRecipeLiked(id!);
        const updatedData = await getRecipeById(id!);
        setRecipe(updatedData);
      } catch (err) {
        console.error("Beğeni eklenemedi:", err);
        alert("Beğeni eklenemedi.");
      }
      return;
    }

    try {
      await incrementLikeCount(id!);
      setIsLiked(true);
      const updatedData = await getRecipeById(id!);
      setRecipe(updatedData);
    } catch (err) {
      console.error("Beğeni eklenemedi:", err);
      alert("Beğeni eklenemedi.");
    }
  };

  if (!recipe) return <div>Yükleniyor...</div>;

  const mainMedia = recipe.media?.[0];
  const galleryMedia = recipe.media?.slice(1) || [];

  return (
    <div className="min-h-screen w-full flex justify-center bg-gradient-to-r from-orange-100 via-orange-200 to-orange-300 py-8">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-2">
        {/* Sol: Tarif Detayı */}
        <div className="flex-1">
          <div className="p-4 bg-white rounded-xl shadow-lg">
            {/* Ana görsel veya video */}
            {mainMedia ? (
              mainMedia.type === "image" ? (
                <img src={mainMedia.url} alt={recipe.title} className="w-full h-64 object-cover rounded-t-xl mb-4" />
              ) : mainMedia.type === "video" ? (
                <video src={mainMedia.url} controls className="w-full h-64 object-cover rounded-t-xl mb-4" />
              ) : null
            ) : (
              <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-t-xl mb-4 text-gray-400">Medya yok</div>
            )}

            {/* Başlık ve favori */}
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold">{recipe.title}</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  className={`text-2xl ${isLiked ? 'text-red-500' : 'text-gray-400'} hover:text-red-500 transition-colors`}
                  title="Beğen"
                  disabled={isLiked}
                >
                  {isLiked ? "❤️" : "🤍"}
                </button>
                <button
                  onClick={handleToggleFavorite}
                  className="text-yellow-500 text-2xl"
                  title="Favorilere ekle"
                >
                  {favoriteIds.includes(id!) ? "⭐" : "☆"}
                </button>
              </div>
            </div>

            {/* Popülerlik bilgileri */}
            <div className="flex gap-4 text-gray-600 mb-4">
              <span className="flex items-center gap-1"><span className="text-lg">⏱️</span> {recipe.duration} dk</span>
              <span className="flex items-center gap-1"><span className="text-lg">📂</span> {recipe.category}</span>
            </div>
            
            <div className="flex gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1">👁️ {recipe.viewCount || 0} görüntüleme</span>
              <span className="flex items-center gap-1">❤️ {recipe.likeCount || 0} beğeni</span>
              <span className="flex items-center gap-1">💬 {recipe.commentCount || 0} yorum</span>
              <span className="flex items-center gap-1">🔥 {Math.round(recipe.popularityScore || 0)} popülerlik</span>
            </div>

            {/* Malzemeler */}
            <h2 className="mt-4 text-xl font-semibold text-left">Malzemeler</h2>
            <ul className="list-disc pl-6 mb-4 text-left">
              {recipe.ingredients.map((i: string, idx: number) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>

            {/* Adımlar */}
            <h2 className="mt-4 text-xl font-semibold text-left">Yapılış Aşamaları</h2>
            <ol className="list-decimal pl-6 mb-4 text-left">
              {recipe.steps.map((s: string, idx: number) => (
                <li key={idx}>{s}</li>
              ))}
            </ol>

            {/* Galeri (diğer medya) */}
            {galleryMedia.length > 0 && (
              <>
                <h2 className="mt-4 text-xl font-semibold">Diğer Görseller / Videolar</h2>
                <div className="grid grid-cols-2 gap-4 my-4">
                  {galleryMedia.map((m, idx) =>
                    m.type === "image" ? (
                      <img key={idx} src={m.url} alt="media" className="rounded shadow w-full h-32 object-cover" />
                    ) : m.type === "video" ? (
                      <video key={idx} src={m.url} controls className="rounded shadow w-full h-32 object-cover" />
                    ) : null
                  )}
                </div>
              </>
            )}

            {/* Yorumlar */}
            <h2 className="mt-4 text-xl font-semibold">Yorumlar</h2>
            <div className="space-y-2">
              {comments.length === 0 && <p>Henüz yorum yok.</p>}
              {comments.map((cmt, idx) => (
                <div key={idx} className="border p-2 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <strong className="text-rose-600">{cmt.userName || "Kullanıcı"}</strong>
                    <small className="text-gray-500">{new Date(cmt.createdAt).toLocaleString()}</small>
                  </div>
                  <p className="text-left">{cmt.content}</p>
                </div>
              ))}
            </div>

            {/* Yorum ekleme */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold">Yorum Yaz</h3>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="w-full border rounded p-2 mt-1"
                placeholder="Yorumunuzu yazın..."
              />
              <button
                onClick={handleCommentSubmit}
                disabled={submitting || newComment.trim().length === 0 || newComment.length > 300}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
              >
                {submitting ? "Gönderiliyor..." : "Yorumu Gönder"}
              </button>
            </div>
          </div>
        </div>
        {/* Sağ: Trend Tarifler ve En Yeni Tarifler */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
            <h3 className="text-xl font-bold text-rose-600 mb-4 text-center">Trend Tarifler</h3>
            {trendingRecipes.length === 0 ? (
              <div className="text-gray-400 text-center">Trend tarif yok.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {trendingRecipes.map((item) => {
                  const firstMedia = item.media?.[0];
                  return (
                    <Link
                      key={item.id}
                      to={`/recipes/${item.id}`}
                      className="flex items-center gap-3 p-2 rounded hover:bg-rose-50 transition"
                      style={{ textDecoration: 'none' }}
                    >
                      {firstMedia ? (
                        firstMedia.type === "image" ? (
                          <img src={firstMedia.url} alt={item.title} className="w-16 h-16 rounded object-cover border" />
                        ) : firstMedia.type === "video" ? (
                          <video src={firstMedia.url} className="w-16 h-16 rounded object-cover border" />
                        ) : null
                      ) : (
                        <img src="https://placehold.co/80x80?text=Tarif" alt={item.title} className="w-16 h-16 rounded object-cover border" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 truncate">{item.title}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {item.ingredients.slice(0, 2).join(", ")}{item.ingredients.length > 2 ? ", ..." : ""}
                        </div>
                        <div className="flex gap-2 text-xs text-gray-400 mt-1">
                          <span>👁️ {item.viewCount || 0}</span>
                          <span>❤️ {item.likeCount || 0}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          {/* En Yeni Eklenen Tarifler */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-xl font-bold text-rose-600 mb-4 text-center">En Yeni Eklenen Tarifler</h3>
            {latestRecipes.length === 0 ? (
              <div className="text-gray-400 text-center">Yeni tarif yok.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {latestRecipes.map((item) => {
                  const firstMedia = item.media?.[0];
                  return (
                    <Link
                      key={item.id}
                      to={`/recipes/${item.id}`}
                      className="flex items-center gap-3 p-2 rounded hover:bg-orange-50 transition"
                      style={{ textDecoration: 'none' }}
                    >
                      {firstMedia ? (
                        firstMedia.type === "image" ? (
                          <img src={firstMedia.url} alt={item.title} className="w-16 h-16 rounded object-cover border" />
                        ) : firstMedia.type === "video" ? (
                          <video src={firstMedia.url} className="w-16 h-16 rounded object-cover border" />
                        ) : null
                      ) : (
                        <img src="https://placehold.co/80x80?text=Tarif" alt={item.title} className="w-16 h-16 rounded object-cover border" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 truncate">{item.title}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {item.ingredients.slice(0, 2).join(", ")}{item.ingredients.length > 2 ? ", ..." : ""}
                        </div>
                        <div className="flex gap-2 text-xs text-gray-400 mt-1">
                          <span>👁️ {item.viewCount || 0}</span>
                          <span>❤️ {item.likeCount || 0}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}