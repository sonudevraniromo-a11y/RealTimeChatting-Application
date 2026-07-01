import { useState , useEffect , useRef } from "react";
import api from "../Services/api";
import { Link , useNavigate } from "react-router-dom";

function Register(){

    const [name , setName] = useState("") ;
    const [email , setEmail] = useState("") ;
    const [password , setPassword ] = useState("") ;
    const [error , setError ] = useState("") ;
    const navigate = useNavigate() ;

  async function handleSubmit(e){

        e.preventDefault() ;
        setError("") ;

        if(!name || !email || !password ){
            setError("fill all credential") ;
            return ; 
        }

        if(password.length < 3){
            setError("password length should be greater than 3") 
            return ; 
        }

        try{

            const response = await api.post("api/auth/register" ,{
                name , 
                email , 
                password
            })

            alert(response.data.message || "Registered SuccessFully") ;
            navigate("/") ;

        }catch(er){
            setError(er.response?.data?.message || "Registration unsuccessFull") ;
            console.log(error) ;
        }

    }

    return (
      <>
        <form onSubmit={handleSubmit}>
          <div className="container mt-5">
            <div className="card p-4 mx-auto" style={{ maxWidth: "400px" }}>
              <h2 className="text-center mb-4">Register</h2>

              {error && <div className="alert alert-danger">{error}</div>}

              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

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
                Register
              </button>

              <p>
                Already have an account? <Link to="/">Login</Link>
              </p>
            </div>
          </div>
        </form>
      </>
    );
}


export default Register 
