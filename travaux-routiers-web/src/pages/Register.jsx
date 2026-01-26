import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/NavBar";
import {
  registerFirebaseApi,
  registerRoleApi,
} from "../api/auth.api";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      /* 1️⃣ Création Firebase */
      await registerFirebaseApi({
        email: form.email,
        password: form.password,
      });

      /* 2️⃣ Création locale (Postgres + rôle) */
      await registerRoleApi({
        email: form.email,
        password: form.password,
      });

      // /* 3️⃣ Login automatique */
      // await login(form.email, form.password);

      navigate("/");
    } catch (err) {
      console.error(err);
      setError(
        typeof err === "string"
          ? err
          : err?.response?.data ||
            err?.message ||
            "Erreur lors de l'inscription"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="container mt-5">
        <h3 className="mb-4">Inscription</h3>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            className="form-control mb-3"
            placeholder="Nom"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            className="form-control mb-3"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />

          <input
            className="form-control mb-3"
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            required
          />

          <button
            className="btn btn-success w-100"
            type="submit"
            disabled={loading}
          >
            {loading ? "Création du compte..." : "S’inscrire"}
          </button>
        </form>
      </div>
    </>
  );
}
