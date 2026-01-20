import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/NavBar";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(form);
    navigate("/");
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <h3>Inscription</h3>

        <form onSubmit={handleSubmit}>
          <input
            className="form-control mb-3"
            placeholder="Nom"
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
          <input
            className="form-control mb-3"
            placeholder="Email"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />
          <input
            className="form-control mb-3"
            type="password"
            placeholder="Mot de passe"
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />
          <button className="btn btn-success w-100">
            S’inscrire
          </button>
        </form>
      </div>
    </>
  );
}
