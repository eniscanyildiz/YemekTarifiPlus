import React from "react";
import { Link } from "react-router-dom";
import type { Recipe } from "../types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
  authorName?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  showFavoriteButton?: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  authorName,
  isFavorite = false,
  onToggleFavorite,
  showFavoriteButton = true,
}) => {
  const firstMedia = recipe.media?.[0];

  return (
    <div className="min-w-[220px] lg:min-w-[280px] bg-white rounded-xl shadow hover:shadow-2xl transition p-4 cursor-pointer group flex flex-col h-full">
      <Link
        to={`/recipes/${recipe.id}`}
        style={{ textDecoration: "none" }}
        className="flex-1 flex flex-col"
      >
        {firstMedia ? (
          firstMedia.type === "image" ? (
            <img
              src={firstMedia.url}
              alt={recipe.title}
              className="rounded-md w-full h-40 lg:h-52 object-cover mb-3 group-hover:scale-105 transition"
            />
          ) : firstMedia.type === "video" ? (
            <video
              src={firstMedia.url}
              controls
              className="rounded-md w-full h-40 lg:h-52 object-cover mb-3 group-hover:scale-105 transition"
            />
          ) : null
        ) : (
          <img
            src="https://placehold.co/400x200?text=Tarif"
            alt={recipe.title}
            className="rounded-md w-full h-40 lg:h-52 object-cover mb-3 group-hover:scale-105 transition"
          />
        )}
        <div className="font-bold text-gray-800 text-lg lg:text-xl text-left mb-2">
          {recipe.title}
        </div>
        <div className="border-t border-gray-200 my-2"></div>
        <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
          <span className="truncate max-w-[60%]">
            {authorName ? (
              <span className="font-semibold text-rose-600">{authorName}</span>
            ) : (
              <span className="italic text-gray-400">Yazar Bilinmiyor</span>
            )}
          </span>
          <span className="flex gap-2 items-center">
            <span title="Görüntüleme">
              <span role="img" aria-label="görüntüleme">👁️</span> {recipe.viewCount || 0}
            </span>
            <span title="Beğeni">
              <span role="img" aria-label="beğeni">❤️</span> {recipe.likeCount || 0}
            </span>
            <span title="Yorum">
              <span role="img" aria-label="yorum">💬</span> {recipe.commentCount || 0}
            </span>
            <span title="Süre">
              <span role="img" aria-label="süre">⏱️</span> {recipe.duration} dk
            </span>
          </span>
        </div>
      </Link>
      {showFavoriteButton && onToggleFavorite && (
        <button
          onClick={() => onToggleFavorite(recipe.id)}
          className={`mt-2 text-sm font-semibold px-3 py-1 rounded transition w-full ${isFavorite ? "bg-rose-100 text-rose-600" : "bg-gray-100 text-gray-600"}`}
        >
          {isFavorite ? "★ Favoriden çıkar" : "☆ Favorilere ekle"}
        </button>
      )}
    </div>
  );
};

export default RecipeCard; 