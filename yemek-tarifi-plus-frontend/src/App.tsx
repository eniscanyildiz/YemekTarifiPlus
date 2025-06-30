import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RecipeListPage from "./pages/RecipeListPage";
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import RecipeAddPage from './pages/RecipeAddPage';
import RecipeDetailPage from "./pages/RecipeDetailPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import React from "react";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="relative min-h-screen w-full bg-gray-100">
        {/* Ana İçerik */}
        <div className="relative z-10 w-full min-h-screen">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/recipes/add" element={<ProtectedRoute><RecipeAddPage /></ProtectedRoute>} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
