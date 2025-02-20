import React, { useState, useEffect } from "react";

const SkillsDisplay = ({ userName }) => {
    const [developerData, setDeveloperData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDeveloperData = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:5000/developer/${userName}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch developer data');
                }
                const data = await response.json();
                setDeveloperData(data);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching developer data:', err);
            }
        };

        if (userName) {
            fetchDeveloperData();
        }
    }, [userName]);

    if (error) {
        return <div>Error: {error}</div>;
    }


    return (
        <div>
            <h2>Developer Profile</h2>
            <pre>{JSON.stringify(developerData, null, 2)}</pre>
        </div>
    );
};

export default SkillsDisplay;