import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Footer: React.FC = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/recipes?search=${encodeURIComponent(search)}`);
      setSearch("");
    }
  };

  return (
    <footer className="bg-gradient-to-r from-orange-100 via-orange-200 to-orange-300 bg-opacity-80 border-t pt-8 pb-4 mt-8 w-full text-gray-700">
      {/* Sponsorlar */}
      <div className="max-w-5xl mx-auto px-8">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-rose-600 mb-2 text-center">Sponsorlar</h3>
          <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 text-2xl md:text-3xl font-semibold tracking-wide">
            Buraya sponsor logoları eklenecek
          </div>
        </div>
        {/* Arama Çubuğu */}
        <form onSubmit={handleSearch} className="flex justify-center mb-8">
          <input
            type="text"
            className="w-full max-w-2xl px-6 py-3 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent shadow text-base md:text-lg"
            placeholder="Tarif, malzeme veya kategori ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            type="submit"
            className="bg-rose-600 text-white px-6 py-3 rounded-r-lg font-semibold hover:bg-rose-700 transition text-base md:text-lg"
          >
            Ara
          </button>
        </form>
        {/* Alt Bilgi */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-sm text-gray-500 border-t pt-6 w-full text-center">
          <span className="mx-2">
            <a href="#" className="hover:underline">Privacy Policy</a>
          </span>
          <span className="hidden md:inline">|</span>
          <span className="mx-2">
            <a href="#" className="hover:underline">Terms</a>
          </span>
          <span className="hidden md:inline">|</span>
          <span className="mx-2">© 2025 Tarifim.com Tüm hakları saklıdır.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 