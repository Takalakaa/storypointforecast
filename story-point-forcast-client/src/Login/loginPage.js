import React from 'react';
import { useState } from 'react';
import { Col, Form, Card} from 'reactstrap';

export default function Login() {
  const baseUrl = "http://localhost:5000"
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
    
  const handleSubmit = (event) => {
    event.preventDefault();
    login()
  };

  const login = async () => {
    let route = baseUrl + "/login"
    const response = await fetch (route, {
        method: 'POST',
        mode:'no-cors',
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
          name: username,
          password: password,
          action: "login"
        }),
        
    })
    .then(
      (response) => 
      {
          if (response.status === 200)
              return (response.json()) ;
          else
              return ([ ["status ", response.status]]);
      }
      )//The promise response is returned, then we extract the json data
  }
  return (
    <Card>
      <Col style={styles.container}>
        <h2>Login</h2>
        <Form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" style={styles.button}>Login</button>
        </Form>
      </Col>
    </Card>
  );
};
const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }
}