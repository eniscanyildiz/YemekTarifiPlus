import React, { useState } from "react";
import { loginUser } from "../api/auth";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const setToken = useAuthStore((s) => s.setToken);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Lütfen tüm alanları doldurun.");
      return;
    }
    setError("");
    try {
      const res = await loginUser({email, password});
      setToken(res.data.token);
      localStorage.setItem("accessToken", res.data.token);
      localStorage.setItem("userId", res.data.userId);
      setTimeout(() => {
        navigate("/");
      }, 100);
    } catch (error) {
      alert("Giriş başarısız" + (error instanceof Error ? `: ${error.message}` : ""));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-rose-100 to-orange-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-3xl font-extrabold text-rose-600 text-center mb-6">YemekTarifi+</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Giriş Yap</h2>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-gray-700 mb-1">E-posta</label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-rose-400"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="E-posta adresiniz"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Şifre</label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-rose-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Şifreniz"
              required
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full bg-rose-600 text-white py-2 rounded font-semibold hover:bg-rose-700 transition"
          >
            Giriş Yap
          </button>
        </form>
        <div className="text-center text-gray-500 text-sm mt-4">
          Hesabınız yok mu? <a href="#" className="text-rose-600 hover:underline">Kayıt Ol</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;