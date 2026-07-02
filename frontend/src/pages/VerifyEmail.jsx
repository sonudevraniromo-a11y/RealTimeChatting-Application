import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../Services/api";
import Loader from "../components/Loader";

function VerifyEmail() {
  const { token } = useParams();
  const called = useRef(false);
  const [message, setMessage] = useState("Verifying...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    async function verify() {
      setLoading(true);
      try {
        const response = await api.get(`/api/auth/verify-email/${token}`);

        setMessage(response.data.message);
      } catch (err) {
        setMessage(err.response?.data?.message || "Verification failed");
      }finally{
         setLoading(false);
      }
    }

    verify();
  }, [token]);

  return (
    <>
      {loading && <Loader text="Verifying your email..." />}
      
      <div className="container mt-5">
        <div className="card p-4 mx-auto">
          <h2>Email Verification</h2>
          <p>{message}</p>
        </div>
      </div>
    </>
  );
}

export default VerifyEmail;
