import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/NavBar";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
    //   await login(email, password);
      if(email === "manager@gmail.com"){
        navigate("/manager");
      }else{
          navigate("/utilisateur");
      }
    } catch {
      setError("Identifiants incorrects");
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
