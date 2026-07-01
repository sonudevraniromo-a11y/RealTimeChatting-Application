import { useState , useRef , useEffect  } from "react";
import api from "../Services/api";
import { Link , Navigate, useNavigate } from 'react-router-dom'


function login(){

    const [email , setEmail ] = useState("") ;
    const [password , setPassword ] = useState("") ;
    const [error , setError ] = useState("") ;
    const navigate = useNavigate() ;

    async function handleSubmit (e){
        e.preventDefault() ;
        setError("") ;
      try{
        const response = await api.post("/api/auth/login" , {email,password}) ;
        console.log(response.data) ;
        localStorage.setItem("token", response.data.accessToken) ;
        navigate('/dashboard') ;
      }catch(err){
        setError(err.response?.data?.message || "Login failed");
      }
    }
     return (
       <div className="container mt-5">
         <div className="card p-4 mx-auto" style={{ maxWidth: "400px" }}>
           <h2 className="text-center mb-4">Login</h2>

           {error && <div className="alert alert-danger">{error}</div>}

           {error === "Please verify your email first" && (
             <div className="mb-3">
               <Link to="/resend-verification">Resend Verification Email</Link>
             </div>
           )}

           <form onSubmit={handleSubmit}>
             <div className="mb-3">
               <label className="form-label">Email</label>

               <input
                 type="email"
                 className="form-control"
                 placeholder="Enter Email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 required
               />
             </div>

             <div className="mb-3">
               <label className="form-label">Password</label>

               <input
                 type="password"
                 className="form-control"
                 placeholder="Enter Password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 required
               />
             </div>

             <button className="btn btn-primary w-100" type="submit">
               Login
             </button>
           </form>

           <p className="mt-3">
             Don't have an account? <Link to="/register">Register</Link>
           </p>

           <p>
             <Link to="/forgot-password">Forgot Password?</Link>
           </p>
         </div>
       </div>
     );
}

export default login ;