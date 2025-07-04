import React, { useState, useEffect } from "react";
import { getCategories, createRecipe } from "../api/recipes";
import { uploadMedia } from "../api/media";
import type { RecipeMedia } from "../types/recipe";

interface Category {
  id: string;
  name: string;
}

const RecipeAddPage = () => {
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [duration, setDuration] = useState<number>(30);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const addIngredient = () => setIngredients([...ingredients, ""]);
  const removeIngredient = (index: number) => setIngredients(ingredients.filter((_, i) => i !== index));
  const addStep = () => setSteps([...steps, ""]);
  const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !categoryId || ingredients.some(i => !i.trim()) || steps.some(s => !s.trim()) || duration <= 0) {
      setError("Lütfen tüm alanları eksiksiz doldurun.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      let media: RecipeMedia[] = [];
      if (selectedFiles.length > 0) {
        media = await uploadMedia(selectedFiles);
      }
      await createRecipe({
        title,
        ingredients: ingredients.filter(i => i.trim()),
        steps: steps.filter(s => s.trim()),
        duration,
        categoryId,
        media,
      });
      alert("Tarif başarıyla eklendi!");
    } catch (err) {
      setError("Tarif eklenirken hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-orange-100 via-orange-200 to-orange-300 py-8">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
        <div className="text-3xl font-extrabold text-rose-600 text-center mb-6">Tarif Ekle</div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Başlık</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-rose-400"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Tarif başlığı"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Malzemeler</label>
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-rose-400"
                  value={ing}
                  onChange={e => handleIngredientChange(i, e.target.value)}
                  placeholder={`Malzeme #${i + 1}`}
                  required
                />
                {ingredients.length > 1 && (
                  <button type="button" onClick={() => removeIngredient(i)} className="text-red-500 font-bold">X</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addIngredient} className="text-rose-600 hover:underline">+ Malzeme Ekle</button>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Yapılış Adımları</label>
            {steps.map((step, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-rose-400"
                  value={step}
                  onChange={e => handleStepChange(i, e.target.value)}
                  placeholder={`Adım #${i + 1}`}
                  required
                />
                {steps.length > 1 && (
                  <button type="button" onClick={() => removeStep(i)} className="text-red-500 font-bold">X</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addStep} className="text-rose-600 hover:underline">+ Adım Ekle</button>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Süre (dakika)</label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-rose-400"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              min={1}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Kategori</label>
            <select
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-rose-400"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              required
            >
              <option value="">Kategori Seçiniz</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Görseller / Videolar</label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="w-full"
              onChange={handleFileChange}
            />
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="relative group border rounded overflow-hidden">
                    {file.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-24 object-cover"
                      />
                    ) : file.type.startsWith("video/") ? (
                      <video
                        src={URL.createObjectURL(file)}
                        className="w-full h-24 object-cover"
                        controls
                      />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center bg-gray-100">Dosya</div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-80 hover:opacity-100"
                      title="Kaldır"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-rose-600 text-white py-2 rounded font-semibold hover:bg-rose-700 transition"
            disabled={uploading}
          >
            {uploading ? "Yükleniyor..." : "Tarif Ekle"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RecipeAddPage;