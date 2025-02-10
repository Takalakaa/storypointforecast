import React from "react";
import { Route, Routes } from "react-router-dom"
import TestDisplay from "./TestDisplay"

const Router = () => {
    return (
        <div className="container">
            <Routes>
                <Route path="/" element={<TestDisplay text={"HOME"} />} />
                <Route path="/project" element={<TestDisplay text={"PROJECT"} />} />
                <Route path="/compare" element={<TestDisplay text={"COMPARE"} />} />
                <Route path="/skills" element={<TestDisplay text={"SKILLS"} />} />
                <Route path="/profile" element={<TestDisplay text={"PROFILE"} />} />
            </Routes>
        </div>
    );
}

export default Router;