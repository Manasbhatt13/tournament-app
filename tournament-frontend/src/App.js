import { useState } from "react";
import axios from "axios";

const API = "https://tournament-app-4q7h.onrender.com";

function App() {

  // ROLE + AUTH
  const [role,setRole]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [token,setToken]=useState("");

  // ORGANIZER
  const [name,setName]=useState("");
  const [location,setLocation]=useState("");

  // TEAM
  const [query,setQuery]=useState("");
  const [results,setResults]=useState([]);
  const [teamName,setTeamName]=useState("");
  const [captain,setCaptain]=useState("");

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

  // ORGANIZER ACTION
  const createTournament=async()=>{
    await axios.post(`${API}/tournament`,
      {name,location},
      {headers:{Authorization:token}}
    );
    alert("Tournament Created!");
  };

  // TEAM ACTIONS
  const search=async()=>{
    const res = await axios.get(`${API}/search?q=${query}`);
    setResults(res.data);
  };

  const registerTeam=async(id)=>{
    await axios.post(`${API}/team`,{
      tournamentID:id,
      teamName,
      captain,
      paymentProof:"paid"
    });
    alert("Team Registered!");
  };

  // UI FLOW

  if(!role){
    return(
      <div style={{padding:40}}>
        <h2>Select Role</h2>
        <button onClick={()=>setRole("organizer")}>Organizer</button>
        <button onClick={()=>setRole("team")}>Team</button>
      </div>
    )
  }

  if(!token){
    return(
      <div style={{padding:40}}>
        <h2>{role} Login</h2>

        <input placeholder="Email"
          onChange={e=>setEmail(e.target.value)} />

        <input placeholder="Password" type="password"
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

        <input placeholder="Search tournament"
          onChange={e=>setQuery(e.target.value)} />

        <button onClick={search}>Search</button>

        {results.map(t=>(
          <div key={t.id} style={{border:"1px solid gray",margin:10,padding:10}}>
            <h3>{t.name}</h3>
            <p>Location: {t.location}</p>
            <p>Code: {t.code}</p>

            <input placeholder="Team Name"
              onChange={e=>setTeamName(e.target.value)} />

            <input placeholder="Captain Name"
              onChange={e=>setCaptain(e.target.value)} />

            <button onClick={()=>registerTeam(t.id)}>
              Register Team
            </button>
          </div>
        ))}
      </div>
    )
  }

}

export default App;
