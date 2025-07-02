import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import LogoutButton from "./LogoutButton";
import { FaInstagram, FaFacebookF, FaPinterestP, FaYoutube, FaSearch, FaPlus, FaUser, FaSignOutAlt } from "react-icons/fa";

const Navbar: React.FC = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const email = useAuthStore((state) => state.email);
  const navigate = useNavigate();
  const [isSticky, setIsSticky] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/recipes?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm("");
    }
  };

  return (
    <nav
      className={`sticky top-0 w-full z-20 transition-colors transition-shadow duration-100 ${
        isSticky ? "bg-gradient-to-r from-orange-100 via-orange-200 to-orange-300 bg-opacity-90 shadow" : "bg-gradient-to-r from-orange-100 via-orange-200 to-orange-300 bg-opacity-80"
      }`}
      style={{ left: 0, right: 0 }}
    >
      <div className="flex justify-between items-center w-full" style={{ minHeight: '64px' }}>
        <div className="pl-5 text-xl lg:text-2xl font-bold text-rose-600 cursor-pointer" onClick={() => navigate("/")}>Tarifim.com</div>
        <form onSubmit={handleSearch} className="flex-1 flex justify-center">
          <div className="relative w-full max-w-lg">
            <input
              type="text"
              className="w-full pl-4 pr-10 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent shadow-sm text-sm"
              placeholder="Tarif, malzeme veya kategori ara..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-500 hover:text-rose-700">
              <FaSearch />
            </button>
          </div>
        </form>
        <div className="pr-6 flex items-center gap-2 lg:gap-3">
          {isLoggedIn ? (
            <>
              <button
                className="flex items-center gap-2 bg-gradient-to-r from-green-400 to-green-600 text-white px-4 py-2 rounded-full shadow hover:from-green-500 hover:to-green-700 transition text-base font-semibold"
                onClick={() => navigate("/recipes/add")}
              >
                <FaPlus className="text-lg" /> Tarif Ekle
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-full shadow border border-gray-200 bg-white hover:bg-rose-50 transition text-base font-semibold text-gray-700 hover:text-rose-600"
                onClick={() => navigate("/profile")}
              >
                <span className="inline-block w-8 h-8 rounded-full bg-rose-200 flex items-center justify-center text-rose-700 font-bold text-base">
                  <FaUser className="text-lg" />
                </span>
                Profil
              </button>
              <button
                onClick={() => { useAuthStore.getState().logout(); navigate("/login"); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full shadow border border-red-500 text-red-600 bg-white hover:bg-red-50 transition text-base font-semibold"
              >
                <FaSignOutAlt className="text-lg" /> Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-full shadow border border-gray-300 bg-white hover:bg-rose-50 transition text-base font-semibold text-gray-700 hover:text-rose-600"
                onClick={() => navigate("/login")}
              >
                <FaUser className="text-lg" /> Giriş Yap
              </button>
              <button
                className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-orange-400 text-white px-4 py-2 rounded-full shadow hover:from-rose-600 hover:to-orange-500 transition text-base font-semibold"
                onClick={() => navigate("/register")}
              >
                <FaPlus className="text-lg" /> Kayıt Ol
              </button>
            </>
          )}
          <span className="inline-flex items-center">
            <span className="mr-1">
              <FaInstagram className="text-pink-500 hover:text-pink-600 transition text-2xl" title="Instagram" />
            </span>
            <span className="mr-1">
              <FaFacebookF className="text-blue-600 hover:text-blue-800 transition text-2xl" title="Facebook" />
            </span>
            <span className="mr-1">
              <FaPinterestP className="text-red-600 hover:text-red-700 transition text-2xl" title="Pinterest" />
            </span>
            <span>
              <FaYoutube className="text-red-500 hover:text-red-700 transition text-2xl" title="YouTube" />
            </span>
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;