import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

export function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    // Dummy signup logic
     if (name && email && password) {
      // You can send this to backend later
      const userData = { name, email, password };

      console.log(userData);

      localStorage.setItem("token", "dummy-token");
      localStorage.setItem("user", JSON.stringify(userData));

      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-md space-y-4 p-6 border rounded-xl"
      >
        <h2 className="text-2xl font-bold text-center">Sign Up</h2>

         <input
          type="text"
          placeholder="Full Name"
          className="w-full p-2 border rounded text-black"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

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
          Sign Up
        </button>

        <p className="text-sm text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
