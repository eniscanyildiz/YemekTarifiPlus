import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:7071/api", // API Gateway adresi
  headers: {
    "Content-Type": "application/json"
  }
});

instance.interceptors.request.use(config => {
  const token = localStorage.getItem("accessToken");
  console.log("Interceptor token:", token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;