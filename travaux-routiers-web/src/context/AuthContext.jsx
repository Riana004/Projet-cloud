import { createContext, useContext, useEffect, useState } from "react";
import { loginFirebaseApi } from "../api/auth.api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  try {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  } catch (e) {
    console.warn("Session corrompue, nettoyage...");
    localStorage.clear();
  }
  setLoading(false);
}, []);


  const login = async (email, password) => {
  try {
    const res = await loginFirebaseApi({ email, password });

    // Firebase login retourne juste un message
    setUser({ email });
    setToken("firebase-session");

    localStorage.setItem("user", JSON.stringify({ email }));
    localStorage.setItem("token", "firebase-session");

    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};



  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
