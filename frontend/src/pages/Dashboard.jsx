import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Services/api";
import { useSocket } from "../context/SocketContext";
import Loader from "../components/Loader";

function Dashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { socket, onlineUsers } = useSocket();

  async function handleLogout() {
    try {
      const response = await api.post("/api/auth/logOut", {});
      localStorage.removeItem("token");
    } catch (error) {
      setError("error in handleLogOut");
    }
    navigate("/");
  }

  async function handleRefresh() {
    try {
      const response = await api.post("/api/auth/refresh", {});
      localStorage.setItem("token", response.data.accessToken);
      alert("token refreshed SuccessFully");
    } catch (err) {
      console.error("Refresh error:", err.response?.data || err.message);
      alert("Failed to refresh token");
      navigate("/");
    }
  }

  async function getProfile() {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/profile");

      setName(response.data.user.name);
      setRole(response.data.user.role);
    } catch (err) {
      console.error(
        "Error fetching profile:",
        err.response?.data || err.message,
      );
      setLoading(false);
      navigate("/");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoutAll() {
    try {
      await api.post("/api/auth/logout-all");
      localStorage.removeItem("token");
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("token not fOund ");
      navigate("/");
      return;
    }
    getProfile();
  }, [navigate]);

  return (
    <>
      {loading && <Loader text="loading dashboard" />}
      <div>
        <h1>
          Dashboard this is the profile of {name} role is {role}
        </h1>
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={handleLogout}
        >
          LogOut
        </button>
        <button
          type="button"
          className="btn btn-outline-success ms-2"
          onClick={handleRefresh}
        >
          Refresh Token
        </button>
        <button className="btn btn-warning" onClick={() => navigate("/admin")}>
          Go to Admin Panel
        </button>
        <button onClick={() => navigate("/change-password")}>
          Change Password
        </button>
        <button className="btn btn-danger" onClick={handleLogoutAll}>
          Logout All Devices
        </button>
        <button className="btn btn-primary" onClick={() => navigate("/chat")}>
          Open Chat
        </button>
      </div>
    </>
  );
}

export default Dashboard;
