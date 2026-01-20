// src/context/AuthContext.jsx
import { createContext, useState } from "react";
import { users } from "../data/users.mock";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    const found = users.find(
      u => u.email === email && u.password === password
    );
    if (!found) return false;
    setUser(found);
    return true;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
