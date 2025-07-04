import React, { useState } from "react";
import { registerUser } from "../api/auth";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      setError("Lütfen tüm alanları doldurun.");
      return;
    }
    setError("");
    try {     
      await registerUser({ email, password, firstName, lastName });
      alert("Kayıt başarılı! Giriş yapabilirsiniz.");
      navigate("/login");
    } catch (err) {
      setError("Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-orange-100 via-orange-200 to-orange-300">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-3xl font-extrabold text-rose-600 text-center mb-6">Tarifim.com</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Kayıt Ol</h2>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-gray-700 mb-1">Ad</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-rose-400"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Adınız"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Soyad</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-rose-400"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Soyadınız"
              required
            />
          </div>
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
            className="w-full bg-green-500 text-white py-2 rounded font-semibold hover:bg-green-600 transition"
          >
            Kayıt Ol
          </button>
        </form>
        <div className="text-center text-gray-500 text-sm mt-4">
          Zaten hesabınız var mı?{' '}
          <span className="text-rose-600 hover:underline cursor-pointer" onClick={() => navigate('/login')}>
            Giriş Yap
          </span>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;