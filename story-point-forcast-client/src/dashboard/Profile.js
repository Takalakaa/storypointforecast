import React, { useState, useEffect } from 'react';
import { Button, Form, FormGroup, Label, Input, Table } from 'reactstrap';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const username = 'johndoe123'; // Change this to dynamically fetch the logged-in user's username

  useEffect(() => {
    fetch(`http://127.0.0.1:5000/profile/${username}`)
      .then((res) => res.json())
      .then((data) => setProfile(data))
      .catch((err) => console.error(err));
  }, [username]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSkillChange = (index, field, value) => {
    const newSkills = [...profile.skills];
    newSkills[index][field] = value;
    setProfile((prev) => ({ ...prev, skills: newSkills }));
  };

  const handleSave = () => {
    fetch(`http://127.0.0.1:5000/profile/${username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        setEditMode(false);
      })
      .catch((err) => console.error(err));
  };

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div className="container mt-4">
      <h2>Profile Page</h2>
      <Form>
        <FormGroup>
          <Label>Name:</Label>
          <Input type="text" name="name" value={profile.name} onChange={handleChange} disabled={!editMode} />
        </FormGroup>
        <FormGroup>
          <Label>Username:</Label>
          <Input type="text" name="username" value={profile.username} disabled />
        </FormGroup>
        <FormGroup>
          <Label>Role:</Label>
          <Input type="text" name="role" value={profile.role} disabled />
        </FormGroup>
        <FormGroup>
          <Label>Password:</Label>
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={profile.password}
            onChange={handleChange}
            disabled={!editMode}
          />
          {editMode && (
            <Button color="secondary" size="sm" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'} Password
            </Button>
          )}
        </FormGroup>

        <h4>Skills</h4>
        <Table striped>
          <thead>
            <tr>
              <th>Skill</th>
              <th>Rank (0-5)</th>
            </tr>
          </thead>
          <tbody>
            {profile.skills.map((skill, index) => (
              <tr key={index}>
                <td>
                  <Input type="text" value={skill.skill} onChange={(e) => handleSkillChange(index, 'skill', e.target.value)} disabled={!editMode} />
                </td>
                <td>
                  <Input
                    type="number"
                    value={skill.rank}
                    min="0"
                    max="5"
                    onChange={(e) => handleSkillChange(index, 'rank', e.target.value)}
                    disabled={!editMode}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {editMode ? (
          <Button color="primary" onClick={handleSave}>Save</Button>
        ) : (
          <Button color="warning" onClick={() => setEditMode(true)}>Edit Profile</Button>
        )}
      </Form>
    </div>
  );
}