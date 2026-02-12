import { useState } from "react";
import axios from "axios";

const API = "https://tournament-app-4q7h.onrender.com";

function App() {

  const [role,setRole]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [token,setToken]=useState("");

  const [name,setName]=useState("");
  const [location,setLocation]=useState("");

  // AUTH
  const register=async()=>{
    await axios.post(`${API}/register`,{email,password});
    alert("Registered!");
  };

  const login=async()=>{
    const res=await axios.post(`${API}/login`,{email,password});
    setToken(res.data.token);
    alert("Logged in!");
  };

  const createTournament=async()=>{
    await axios.post(`${API}/tournament`,
      {name,location},
      {headers:{Authorization:token}}
    );
    alert("Tournament Created!");
  };

  // MAIN UI

  if(!role){
    return(
      <div style={{padding:40}}>
        <h2>Select Role</h2>
        <button onClick={()=>setRole("organizer")}>
          Organizer
        </button>

        <button onClick={()=>setRole("team")}>
          Team
        </button>
      </div>
    )
  }

  if(!token){
    return(
      <div style={{padding:40}}>
        <h2>{role} Login</h2>

        <input placeholder="Email"
          onChange={e=>setEmail(e.target.value)} />

        <input placeholder="Password"
          type="password"
          onChange={e=>setPassword(e.target.value)} />

        <br/>

        <button onClick={register}>Register</button>
        <button onClick={login}>Login</button>
      </div>
    )
  }

  if(role==="organizer"){
    return(
      <div style={{padding:40}}>
        <h2>Organizer Dashboard</h2>

        <input placeholder="Tournament Name"
          onChange={e=>setName(e.target.value)} />

        <input placeholder="Location"
          onChange={e=>setLocation(e.target.value)} />

        <button onClick={createTournament}>
          Create Tournament
        </button>
      </div>
    )
  }

  if(role==="team"){
    return(
      <div style={{padding:40}}>
        <h2>Team Dashboard</h2>
        <p>Search & Register for tournaments (next step)</p>
      </div>
    )
  }

}

export default App;
