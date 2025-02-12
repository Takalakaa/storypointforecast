import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Profile from "./components/Profile";
import ProjectView from "./components/ProjectView";
import './App.css';

function App() {
    return (
        <Router>
            <div className="app-container" >
                <h1 >Team Member Profile</h1>
                <Routes>
                    {/* Route for User Profile */}
                    <Route path="/profile/:userId" element={<Profile />} />

                    {/* Route for Manager's Project View */}
                    <Route path="/project/:projectId" element={<ProjectView />} />

                    {/* Default Route */}
                    <Route path="/" element={<h2>Welcome to the Team Profile System</h2>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;