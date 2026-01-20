import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";
import { loginApi } from "../api/auth.api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await loginApi({ email, password });
      const user = response.data;

      if (user.role === "1") {
        navigate("/manager");
      } else if (user.role === "2") {
        navigate("/utilisateur");
      } else {
        setError("Rôle inconnu");
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data);
      } else {
        setError("Erreur réseau");
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <h3>Connexion</h3>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            className="form-control mb-3"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="form-control mb-3"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn btn-primary w-100">
            Se connecter
          </button>
        </form>
      </div>
    </>
  );
}
