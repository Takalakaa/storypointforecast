import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import TestDisplay from "./TestDisplay";
import Login from "../Authentication/loginPage";
import Signup from "../Authentication/signupPage";
import Navbar from "../dashboard/Navbar";

const RouterComponent = () => {
  const [token, setToken] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    if (savedToken) {
      // Authenticate token  
      setToken(savedToken);
    } else if (window.location.pathname === "/signup") {
        // Do nothing
    } else {
      navigate("/login"); // Redirect to /login if no token
    }
  }, [navigate]);

  const handleLogin = (data) => {
    const [name, role, authToken] = data;
    setToken(authToken);
    localStorage.setItem("authToken", authToken);
    navigate("/"); 
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  const hideNavbar = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="container">
      {!hideNavbar && <Navbar token={token} onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={<TestDisplay text={"HOME"} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/project" element={<TestDisplay text={"PROJECT"} />} />
        <Route path="/compare" element={<TestDisplay text={"COMPARE"} />} />
        <Route path="/skills" element={<TestDisplay text={"SKILLS"} />} />
        <Route path="/profile" element={<TestDisplay text={"PROFILE"} />} />
      </Routes>
    </div>
  );
};

export default RouterComponent;
