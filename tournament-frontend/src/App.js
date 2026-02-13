import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API = "https://tournament-app-4q7h.onrender.com";

function App() {

  const [profileDone,setProfileDone]=useState(false);

const [fullName,setFullName]=useState("");
const [age,setAge]=useState("");
const [aadhaar,setAadhaar]=useState("");
const [address,setAddress]=useState("");
const [contact,setContact]=useState("");

const saveProfile=async()=>{
 await axios.post(`${API}/profile`,
 {
  name:fullName,
  age:parseInt(age),
  aadhaar,
  address,
  contact
 },
 {headers:{Authorization:`Bearer ${token}`}}
 );

 setProfileDone(true);
};


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
  if(role==="organizer" && !profileDone){
 return(
 <div className="container">
  <h2>Organizer Profile</h2>

  <input placeholder="Full Name"
  onChange={e=>setFullName(e.target.value)}/>

  <input placeholder="Age"
  onChange={e=>setAge(e.target.value)}/>

  <input placeholder="Aadhaar last 4"
  onChange={e=>setAadhaar(e.target.value)}/>

  <input placeholder="Address"
  onChange={e=>setAddress(e.target.value)}/>

  <input placeholder="Contact"
  onChange={e=>setContact(e.target.value)}/>

  <button onClick={saveProfile}>
   Save Profile
  </button>
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
