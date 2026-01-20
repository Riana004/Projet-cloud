import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
      <Link className="navbar-brand" to="/">
        Travaux Routiers
      </Link>

      <div className="ms-auto">
        {!user ? (
          <>
            <Link className="btn btn-outline-light me-2" to="/login">
              Se connecter
            </Link>
            <Link className="btn btn-light" to="/register">
              S’inscrire
            </Link>
          </>
        ) : (
          <>
            {user.role === "MANAGER" && (
              <span className="text-warning me-3">
                Manager
              </span>
            )}
            <button className="btn btn-danger" onClick={logout}>
              Déconnexion
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
