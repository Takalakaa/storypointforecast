import React, { useEffect, useState, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import TestDisplay from "./TestDisplay";
import Login from "../Authentication/loginPage";
import Signup from "../Authentication/signupPage";
import Navbar from "../dashboard/Navbar";

const RouterComponent = () => {
  const [token, setToken] = useState(null);
  const [userName, setUserName] = useState("");  
  const [userRole, setUserRole] = useState("");  
  const [accessLevel, setAccessLevel] = useState(0); // 0: no access | 1: developer | 2: manager | 3: admin
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogin = (data) => {
    const [name, role, authToken] = data;
    setUserName(name);
    handleRole(role);
    localStorage.setItem("name", name);
    localStorage.setItem("role", role);
    localStorage.setItem("authToken", authToken);
    navigate("/"); 
  };

  const handleLogout = () => {
    setToken(null);
    setUserName("");  
    handleRole("");  
    localStorage.removeItem("authToken");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleRole = useCallback((role) => {
    const accessLevelConfig = {"Developer": 1, "Project Manager": 2, "Admin": 3}
    if(accessLevelConfig[role] != null) {
      setAccessLevel(accessLevelConfig[role]);
      setUserRole(role);
    } else {
      setAccessLevel(0);
      setUserRole("");
    }
  }, [setUserRole, setAccessLevel]);

  const hideNavbar = location.pathname === "/login" || location.pathname === "/signup";

  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    const savedName = localStorage.getItem("name");
    const savedRole = localStorage.getItem("role");
    if (savedToken && savedName && savedRole) {
      // Authenticate token  
      setToken(savedToken);
      setUserName(savedName);
      handleRole(savedRole);
    } else if (window.location.pathname === "/signup") {
        // Do nothing
    } else {
      navigate("/login"); // Redirect to /login if no token
    }
  }, [navigate, handleRole]);

  return (
    <div className="container">
      {!hideNavbar && <Navbar token={token} accessLevel={accessLevel} onLogout={handleLogout} />} 
      <Routes>
        <Route path="/" element={<TestDisplay text={"HOME"} />} />
        <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/project" element={<TestDisplay text={"PROJECT"} />} />
        {accessLevel > 1 && <Route path="/compare" element={<TestDisplay text={"COMPARE"} />} />}
        <Route path="/skills" element={<TestDisplay text={"SKILLS"} />} />
        <Route path="/profile" element={<TestDisplay text={userName + " : " + userRole + " : " + accessLevel} />} />
      </Routes>
    </div>
  );
};

export default RouterComponent;
