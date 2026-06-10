import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:3000/admin/login",
        {
          email,
          password,
        }
      );

      localStorage.setItem("token", res.data.token);

      navigate("/admin");
    } catch (error) {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">
          Admin Login
        </h1>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block mb-2">Email</label>

            <input
              type="email"
              className="w-full border rounded-lg p-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2">Password</label>

            <input
              type="password"
              className="w-full border rounded-lg p-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className="w-full bg-blue-600 text-white py-3 rounded-lg"
            type="submit"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}