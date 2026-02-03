import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavBar";
import { loginFirebaseApi, loginRoleApi } from "../api/auth.api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  try {
    // 1️⃣ Auth Firebase
    // const firebaseResponse = await loginFirebaseApi({ email, password });
    // if (!email || !password) {
    //   setError("Email et mot de passe sont obligatoires");
    //   return;
    // }

    // console.log("Firebase response:", firebaseResponse.data); // DEBUG
    // if (!firebaseResponse.data) {
    //   setError("Identifiants invalides (Firebase)");
    //   return;
    // }

    // 2️⃣ Auth rôle
    const roleResponse = await loginRoleApi({ email, password });
    console.log("Role response:", roleResponse.data); // DEBUG
    const user = roleResponse.data;

    if (!user || !user.role) {
      setError("Impossible de récupérer le rôle de l'utilisateur");
      return;
    }

    // 3️⃣ Navigation
    if (user.role === "1") navigate("/manager");
    // else if (user.role === "2" || user.role === "3") navigate("/utilisateur");
    // else setError("Rôle inconnu");

  } catch (err) {
    console.error(err);
    if (err.response && err.response.data) setError(err.response.data);
    else setError("Erreur réseau");
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
