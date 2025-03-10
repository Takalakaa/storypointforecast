import React, { useState, useEffect } from 'react';
import { Button, Form, FormGroup, Label, Input, Table } from 'reactstrap';

export default function ProfilePage({userName}) {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newName, setName] = useState("");
  const [gitName, setGitName] = useState("");
  const [role, setRole] = useState("");
  const username = userName;

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/profile/${username}`, {method: 'GET'})
      .then((res) => res.json())
      .then((data) => setProfile(data))
      .catch((err) => console.error(err));
  }, [username]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(e.target);
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const response = await fetch(`http://127.0.0.1:5000/profile/${username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({"name": (newName != "") ? newName : profile.name, "git_name": (gitName != "") ? gitName : profile.gitName , "role": (role != "") ? role : profile.role}),
    })
    if (response.status === 200) {
      setEditMode(false);
      localStorage.setItem("name", (newName != "") ? newName : profile.name);
      localStorage.setItem("role", (role != "") ? role : profile.role);
    } else {
      console.error("Update failed:", response.status);
    }
  };

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div className="container mt-4">
      <h2>Profile Page</h2>
      <Form>
        <FormGroup>
          <Label>Github Username:</Label>
          <Input type="text" name="git_username" onChange={(e) => setGitName(e.target.value)} placeholder={profile.git_name} value={gitName} disabled={!editMode} />
        </FormGroup>
        <FormGroup>
          <Label>Username:</Label>
          <Input type="text" name="username" onChange={(e) => setName(e.target.value)} placeholder={profile.name} value={newName} disabled={!editMode} />
        </FormGroup>
        <FormGroup>
          <Label>Role:</Label>
          <Input type="text" name="role" onChange={(e) => setRole(e.target.value)} placeholder={profile.role} value={role} disabled={!editMode} />
        </FormGroup>

        {editMode ? (
          <Button color="primary" onClick={handleSave}>Save</Button>
        ) : (
          <Button color="warning" onClick={() => setEditMode(true)}>Edit Profile</Button>
        )}
      </Form>
    </div>
  );
}