import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // Import useParams
import { getUser, updateUser } from "../api";

const Profile = () => {
    const { userId } = useParams(); // Get userId from the URL
    const [user, setUser] = useState(null);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", skills: {} });

    useEffect(() => {
        if (userId) {
            getUser(userId).then(setUser);
        }
    }, [userId]);

    const handleEdit = () => {
        setFormData(user);
        setEditing(true);
    };

    const handleSave = async () => {
        await updateUser(userId, formData);
        setUser(formData);
        setEditing(false);
    };

    if (!user) return <p>Loading...</p>;

    return (
        <div className="profile-container">
            <h1>{user.name}</h1>
            <p>Email: {user.email}</p>

            <h3>Skill Rankings</h3>
            <ul>
                {Object.entries(user.skills).map(([skill, level]) => (
                    <li key={skill}>{skill}: {level}%</li>
                ))}
            </ul>

            {!editing ? (
                <button onClick={handleEdit}>Edit Profile</button>
            ) : (
                <div>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    <button onClick={handleSave}>Save</button>
                </div>
            )}
        </div>
    );
};

export default Profile;
