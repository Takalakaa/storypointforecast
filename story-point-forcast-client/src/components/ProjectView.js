import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // Import useParams
import { getProjectDevelopers } from "../api";

const ProjectView = () => {
    const { projectId } = useParams(); // Get projectId from the URL
    const [developers, setDevelopers] = useState([]);

    useEffect(() => {
        if (projectId) {
            getProjectDevelopers(projectId).then(setDevelopers);
        }
    }, [projectId]);

    return (
        <div className="project-container">
            <h1>Project Developers</h1>
            {developers.length === 0 ? (
                <p>No developers assigned to this project.</p>
            ) : (
                <ul>
                    {developers.map((dev) => (
                        <li key={dev._id}>
                            <h3>{dev.name}</h3>
                            <p>{dev.email}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ProjectView;
