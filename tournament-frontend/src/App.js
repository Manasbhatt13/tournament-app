import { useState } from "react";
import axios from "axios";

const API = "https://tournament-app-4q7h.onrender.com";

function App() {

  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [token,setToken]=useState("");

  const [tname,setTname]=useState("");
  const [location,setLocation]=useState("");
  const [code,setCode]=useState("");

  const [team,setTeam]=useState("");
  const [captain,setCaptain]=useState("");
  const [tid,setTid]=useState("");

  // REGISTER
  const register=async()=>{
    await axios.post(`${API}/register`,{email,password});
    alert("Registered!");
  };

  // LOGIN
  const login=async()=>{
    const res=await axios.post(`${API}/login`,{email,password});
    setToken(res.data.token);
    alert("Logged in!");
  };

  // CREATE TOURNAMENT
  const createTournament=async()=>{
    const res=await axios.post(`${API}/tournament`,
      {name:tname,location},
      {headers:{Authorization:token}}
    );
    setCode(res.data.code);
  };

  // REGISTER TEAM
  const addTeam=async()=>{
    await axios.post(`${API}/team`,{
      tournamentID:parseInt(tid),
      teamName:team,
      captain,
      paymentProof:"paid"
    });
    alert("Team submitted!");
  };

  return (
    <div style={{padding:40,fontFamily:"Arial"}}>
      <h2>🏆 Tournament Platform</h2>

      <h3>Organizer Auth</h3>
      <input placeholder="Email" onChange={e=>setEmail(e.target.value)}/>
      <input placeholder="Password" type="password"
             onChange={e=>setPassword(e.target.value)}/>
      <br/>
      <button onClick={register}>Register</button>
      <button onClick={login}>Login</button>

      <hr/>

      <h3>Create Tournament</h3>
      <input placeholder="Tournament Name"
             onChange={e=>setTname(e.target.value)}/>
      <input placeholder="Location"
             onChange={e=>setLocation(e.target.value)}/>
      <button onClick={createTournament}>Create</button>

      {code && <p>✅ Tournament Code: {code}</p>}

      <hr/>

      <h3>Team Registration</h3>
      <input placeholder="Tournament ID"
             onChange={e=>setTid(e.target.value)}/>
      <input placeholder="Team Name"
             onChange={e=>setTeam(e.target.value)}/>
      <input placeholder="Captain Name"
             onChange={e=>setCaptain(e.target.value)}/>
      <button onClick={addTeam}>Register Team</button>

    </div>
  );
}

export default App;

