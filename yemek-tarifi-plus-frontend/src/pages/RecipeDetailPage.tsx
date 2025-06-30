import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getRecipeById } from "../api/recipes";
import { getCommentsByRecipeId, postComment } from "../api/comments";
import { getFavorites, toggleFavoriteRecipe } from "../api/auth";
import type { RecipeMedia } from "../types/recipe";

interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  duration: number;
  category: string;
  media?: RecipeMedia[];
}

interface Comment {
  content: string;
  createdAt: string;
  userName?: string;
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const data = await getRecipeById(id);
      setRecipe(data);

      const cmts = await getCommentsByRecipeId(id);
      setComments(cmts);
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

    

  if (!recipe) return <div>Yükleniyor...</div>;

  // Ana medya (ilk image veya video)
  const mainMedia = recipe.media?.[0];
  const galleryMedia = recipe.media?.slice(1) || [];

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-xl shadow-lg mt-6">
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
        <button
          onClick={handleToggleFavorite}
          className="text-yellow-500 text-2xl"
          title="Favorilere ekle"
        >
          {favoriteIds.includes(id!) ? "⭐" : "☆"}
        </button>
      </div>
      <div className="flex gap-4 text-gray-600 mb-4">
        <span className="flex items-center gap-1"><span className="text-lg">⏱️</span> {recipe.duration} dk</span>
        <span className="flex items-center gap-1"><span className="text-lg">📂</span> {recipe.category}</span>
      </div>

      {/* Malzemeler */}
      <h2 className="mt-4 text-xl font-semibold">Malzemeler</h2>
      <ul className="list-disc pl-6 mb-4">
        {recipe.ingredients.map((i: string, idx: number) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>

      {/* Adımlar */}
      <h2 className="mt-4 text-xl font-semibold">Yapılış Aşamaları</h2>
      <ol className="list-decimal pl-6 mb-4">
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
            <p>{cmt.content}</p>
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
  );
}