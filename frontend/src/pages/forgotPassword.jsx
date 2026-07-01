import { useState } from "react";
import api from "../Services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await api.post("/api/auth/forgot-password", { email });

      setMessage(response.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong");
    }
  }

  return (
    <div className="container mt-5">
      <div className="card p-4 mx-auto" style={{ maxWidth: "400px" }}>
        <h2>Forgot Password</h2>

        {message && <div className="alert alert-info">{message}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            className="form-control mb-3"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button className="btn btn-primary w-100">Send Reset Link</button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
