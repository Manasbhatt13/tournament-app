import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API = "https://tournament-app-4q7h.onrender.com";

function App() {

  // AUTH
  const [role,setRole]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [token,setToken]=useState("");

  // TOURNAMENT
  const [name,setName]=useState("");
  const [location,setLocation]=useState("");
  const [date,setDate]=useState("");
  const [entryFee,setEntryFee]=useState("");
  const [maxTeams,setMaxTeams]=useState("");
  const [description,setDescription]=useState("");
  const [createdCode,setCreatedCode]=useState("");

  const [tournaments,setTournaments]=useState([]);

  // TEAM
  const [query,setQuery]=useState("");
  const [results,setResults]=useState([]);
  const [teamName,setTeamName]=useState("");
  const [captain,setCaptain]=useState("");

  // REGISTER
  const register=async()=>{
    await axios.post(`${API}/register`,{email,password});
    alert("Registered!");
  };

  // LOGIN
  const login=async()=>{
    const res=await axios.post(`${API}/login`,{email,password});
    setToken(res.data.token);
  };

  // FETCH MY TOURNAMENTS
  const fetchMyTournaments=async()=>{
    if(!token) return;

    const res=await axios.get(
      `${API}/my-tournaments`,
      {headers:{Authorization:`Bearer ${token}`}}
    );
    setTournaments(res.data);
  };

  useEffect(()=>{
    fetchMyTournaments();
  },[token]);

  // CREATE TOURNAMENT
  const createTournament=async()=>{
    if(!name || !location){
      alert("Fill required fields");
      return;
    }

    const res=await axios.post(
      `${API}/tournament`,
      {
        name,
        location,
        date,
        entryFee:parseInt(entryFee)||0,
        maxTeams:parseInt(maxTeams)||0,
        description
      },
      {headers:{Authorization:`Bearer ${token}`}}
    );

    setCreatedCode(res.data.code);
    fetchMyTournaments();
  };

  // TEAM SEARCH
  const search=async()=>{
    const res=await axios.get(`${API}/search?q=${query}`);
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
      <div className="container">
        <h2>Select Role</h2>
        <button onClick={()=>setRole("organizer")}>Organizer</button>
        <button onClick={()=>setRole("team")}>Team</button>
      </div>
    )
  }

  if(!token){
    return(
      <div className="container">
        <h2>{role} Login</h2>

        <input placeholder="Email"
          onChange={e=>setEmail(e.target.value)}/>

        <input type="password" placeholder="Password"
          onChange={e=>setPassword(e.target.value)}/>

        <button onClick={register}>Register</button>
        <button onClick={login}>Login</button>
      </div>
    )
  }

  // ORGANIZER DASHBOARD
  if(role==="organizer"){
    return(
      <div className="container">

        <h2>Create Tournament</h2>

        <input placeholder="Tournament Name"
          onChange={e=>setName(e.target.value)}/>

        <input placeholder="Location"
          onChange={e=>setLocation(e.target.value)}/>

        <input type="date"
          onChange={e=>setDate(e.target.value)}/>

        <input placeholder="Entry Fee"
          onChange={e=>setEntryFee(e.target.value)}/>

        <input placeholder="Max Teams"
          onChange={e=>setMaxTeams(e.target.value)}/>

        <input placeholder="Description"
          onChange={e=>setDescription(e.target.value)}/>

        <button onClick={createTournament}>
          Create Tournament
        </button>

        {createdCode && (
          <div className="success">
            Code: {createdCode}
          </div>
        )}

        <h3>Your Tournaments</h3>

        {tournaments.length===0 ?
          <p>No tournaments yet</p> :
          tournaments.map(t=>(
            <div className="card" key={t.id}>
              <h4>{t.name}</h4>
              <p>{t.location}</p>
              <p>{t.date}</p>
              <p>Code: {t.code}</p>
            </div>
          ))
        }

      </div>
    )
  }

  // TEAM DASHBOARD
  if(role==="team"){
    return(
      <div className="container">

        <h2>Search Tournament</h2>

        <input placeholder="Search..."
          onChange={e=>setQuery(e.target.value)}/>

        <button onClick={search}>Search</button>

        {results.map(t=>(
          <div key={t.id} className="card">
            <h3>{t.name}</h3>
            <p>{t.location}</p>
            <p>{t.code}</p>

            <input placeholder="Team Name"
              onChange={e=>setTeamName(e.target.value)}/>

            <input placeholder="Captain"
              onChange={e=>setCaptain(e.target.value)}/>

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
