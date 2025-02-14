import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import TestDisplay from "./TestDisplay";
import Login from "../Authentication/loginPage";
import Signup from "../Authentication/signupPage";
import Navbar from "../dashboard/Navbar";
import Profile from "../dashboard/Profile";

const RouterComponent = () => {
  const [token, setToken] = useState(null);
  const [userName, setUserName] = useState("");  
  const [userRole, setUserRole] = useState("");  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    const savedName = localStorage.getItem("name");
    const savedRole = localStorage.getItem("role");
    if (savedToken) {
      // Authenticate token  
      setToken(savedToken);
      setUserName(savedName);
      setUserRole(savedRole);
    } else if (window.location.pathname === "/signup") {
        // Do nothing
    } else {
      navigate("/login"); // Redirect to /login if no token
    }
  }, [navigate]);

  const handleLogin = (data) => {
    const [name, role, authToken] = data;
    setUserName(name);
    setUserRole(role);
    localStorage.setItem("name", name);
    localStorage.setItem("role", role);
    localStorage.setItem("authToken", authToken);
    navigate("/"); 
  };

  const handleLogout = () => {
    setToken(null);
    setUserName("");  
    setUserRole("");  
    localStorage.removeItem("authToken");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const hideNavbar = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="container">
      {!hideNavbar && <Navbar token={token} onLogout={handleLogout} />} 
      <Routes>
        <Route path="/" element={<TestDisplay text={"HOME"} />} />
        <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/project" element={<TestDisplay text={"PROJECT"} />} />
        <Route path="/compare" element={<TestDisplay text={"COMPARE"} />} />
        <Route path="/skills" element={<TestDisplay text={"SKILLS"} />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
};

export default RouterComponent;