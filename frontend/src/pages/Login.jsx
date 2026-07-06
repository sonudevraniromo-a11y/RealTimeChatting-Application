import { useState } from "react";
import api from "../Services/api";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import "../styles/auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", response.data.accessToken);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {loading && <Loader text="Logging in..." />}

      <div className="auth-page">
        <div className="auth-panel">
          <div className="auth-panel-content">
            <div className="brand-mark">
              <span className="brand-dot" />
              Welcome back
            </div>
            <h1>
              Good to see
              <br />
              you again.
            </h1>
            <p>
              Sign in to pick up right where you left off. Your projects, your
              data, your dashboard — all one click away.
            </p>
          </div>
          <div className="blob blob-a" />
          <div className="blob blob-b" />
        </div>

        <div className="auth-form-side">
          <div className="auth-card">
            <h2>Log in</h2>
            <p className="auth-subtitle">Enter your details to continue</p>

            {error && (
              <div className="auth-alert" role="alert">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 8v5M12 16h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {error === "Please verify your email first" && (
              <Link to="/resend-verification" className="auth-inline-link">
                Resend verification email →
              </Link>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <div className="field-label-row">
                  <label htmlFor="password">Password</label>
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>
                <div className="password-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M17.94 17.94A10.94 10.94 0 0112 20c-6 0-10-6-10-8 0-1 .58-2.66 1.68-4.24M9.9 4.24A9.12 9.12 0 0112 4c6 0 10 6 10 8 0 .93-.55 2.3-1.5 3.68M14.12 14.12a3 3 0 11-4.24-4.24"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M1 1l22 22"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? "Logging in…" : "Log in"}
              </button>
            </form>

            <p className="auth-footer">
              Don't have an account? <Link to="/register">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
