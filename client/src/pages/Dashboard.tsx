import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Welcome to AutoMind Dashboard</h1>

      <button
        onClick={handleLogout}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}
