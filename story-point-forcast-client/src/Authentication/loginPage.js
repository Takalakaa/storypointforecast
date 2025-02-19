import React, { useState } from 'react';
import { 
  Col, 
  Form, 
  Card, 
  Button, 
  Label, 
  Input, 
  Container } from 'reactstrap';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const baseUrl = "http://localhost:5000";
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Navigation hook

  const handleSubmit = async (event) => {
    event.preventDefault();
    login();
  };

  const login = async () => {
    let route = baseUrl + "/login";
    try {
      const response = await fetch(route, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username, password: password, action: "login" })
      });

      if (response.status === 200) {
        const data = await response.json();
        if (data !== 0) {
          onLogin(data); // Set token in Router.js
          navigate("/"); // Redirect to home after login
        }
      } else {
        console.error("Login failed:", response.status);
      }
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  return (
    <Container>
      <Col md = {{size: 5, offset: 4}} style={styles.mainCol}>
        <Card>
          <Col style={styles.container}>
            <h2>Login</h2>
            <Form onSubmit={handleSubmit} style={styles.form}>
              <Col style={styles.inputGroup}>
                <Label htmlFor="username">Username:</Label>
                <Input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </Col>
              <Col style={styles.inputGroup}>
                <Label htmlFor="password">Password:</Label>
                <Input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </Col>
              <Button type="submit" color='primary' style={styles.loginButton}>Login</Button>
            </Form>
            <Button color="link" onClick={() => navigate("/signup")} style={styles.signupButton}>
              Don't have an account? Sign Up
            </Button>
          </Col>
        </Card>
      </Col>
    </Container>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  signupButton: { marginTop: '10px', textDecoration: 'underline', cursor: 'pointer' },
  loginButton: { marginTop: '10px', cursor: 'pointer'},
  mainCol: {marginTop: '20%'}
};
