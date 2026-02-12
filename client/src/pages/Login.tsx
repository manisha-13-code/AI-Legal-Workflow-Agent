import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Dummy auth (replace with API later)
    if (email && password) {
      localStorage.setItem("token", "dummy-token");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-4 p-6 border rounded-xl"
      >
        <h2 className="text-2xl font-bold text-center">Sign In</h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded text-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-primary text-white py-2 rounded">
          Sign In
        </button>

        <p className="text-sm text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-medium">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}
