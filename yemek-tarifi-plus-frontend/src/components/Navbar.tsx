import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import LogoutButton from "./LogoutButton";

const Navbar: React.FC = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const email = useAuthStore((state) => state.email);
  const navigate = useNavigate();
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 w-full z-20 transition-all duration-300 ${
        isSticky ? "bg-white shadow" : "bg-transparent"
      }`}
      style={{ left: 0, right: 0 }}
    >
      <div className="flex justify-between items-center w-full" style={{ minHeight: '64px' }}>
        <div className="pl-6 text-xl lg:text-2xl font-bold text-rose-600 cursor-pointer" onClick={() => navigate("/")}>YemekTarifi+</div>
        <div className="pr-6 space-x-2 lg:space-x-4 flex items-center">
          {isLoggedIn ? (
            <>
              <button
                className="bg-green-500 text-white px-2 lg:px-4 py-1 lg:py-2 rounded hover:bg-green-600 text-sm lg:text-base"
                onClick={() => navigate("/recipes/add")}
              >
                Tarif Ekle
              </button>
              <button
                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-1 lg:py-2 rounded hover:bg-rose-50 border border-gray-200 text-sm lg:text-base"
                onClick={() => navigate("/profile")}
              >
                <span className="inline-block w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-rose-200 flex items-center justify-center text-rose-700 font-bold text-xs lg:text-sm">
                  {email ? email.charAt(0).toUpperCase() : "P"}
                </span>
                <span className="hidden sm:inline">Profil</span>
              </button>
              <LogoutButton />
            </>
          ) : (
            <>
              <button className="text-gray-700 hover:text-rose-600 text-sm lg:text-base" onClick={() => navigate("/login")}>Giriş Yap</button>
              <button className="bg-rose-600 text-white px-2 lg:px-4 py-1 lg:py-2 rounded hover:bg-rose-700 text-sm lg:text-base" onClick={() => navigate("/register")}>Kayıt Ol</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;