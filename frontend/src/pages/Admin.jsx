
import { useEffect, useState } from "react";
import api from "../Services/api";

function Admin() {
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);

  async function handleDelete(id){
    try{
       await api.delete(`/api/user/${id}`) ;

        setUsers((prevUsers) => prevUsers.filter((user) => user._id != id)) ;
    }catch(err){
        console.log(err.response?.data) ;
    }
  }

  async function handleRole(id){
    try{
        const response = await api.patch(`/api/user/${id}/role`) ;
        
        setUsers(
            users.map((user)=>(user._id === id ? response.data.user : user )),)

    }catch(err){
        console.log(err.response?.data) ;
    }
  }

  useEffect(()=>{
    
    async function getUsers(){
        try{

            const response = await api.get("/api/user/users") ;
            setUsers(response.data) ;
        }catch(err){
            setError(err.response?.data?.message || "something went wrong ") ;
        }
    }
    getUsers() ;
  } , []);

 
  return (
    <>
      <div className="container mt-5">
        <div className="card p-4 mx-auto" style={{ maxWidth: "500px" }}>
          <h2 className="text-center mb-4">Admin Dashboard</h2>

          {error && <div className="alert alert-danger">{error}</div>}

          {users.map((user) => (
            <div key={user._id}>
              <p>Name: {user.name}</p>
              <p>Email: {user.email}</p>
              <p>Role: {user.role}</p>

              <button onClick={() => handleDelete(user._id)}>Delete</button>

              <button onClick={() => handleRole(user._id)}>Change Role</button>

              <hr />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Admin;
