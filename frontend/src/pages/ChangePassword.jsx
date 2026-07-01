import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../Services/api";

function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await api.put("/api/user/change-password", {
        oldPassword,
        newPassword,
      });

      setMessage(response.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Old Password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <button onClick={handleSubmit}>Change Password</button>

        <p>{message}</p>
      </form>
    </>
  );
}

export default ChangePassword;
