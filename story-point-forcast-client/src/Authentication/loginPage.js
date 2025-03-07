import React, { useState } from "react";
import {
  Container,
  Card,
  CardBody,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Row,
  Col,
} from "reactstrap";
import { useNavigate } from "react-router-dom";

export default function Login({ onLogin }) {
  const baseUrl = "http://127.0.0.1:5000";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    login();
  };

  const login = async () => {
    let route = `${baseUrl}/login`;
    try {
      const response = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username, password, action: "login" }),
      });

      if (response.status === 200) {
        const data = await response.json();
        if (data !== 0) {
          onLogin(data);
          navigate("/");
        }
      } else {
        console.error("Login failed:", response.status);
      }
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  return (
    <Container className="mt-4">
      <Card style={{ maxWidth: "500px", margin: "auto" }}>
        <CardBody>
          <h3 className="text-center">Login</h3>
          <Form onSubmit={handleSubmit}>
            <FormGroup className="mb-3">
              <Label htmlFor="username">Username</Label>
              <Input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </FormGroup>

            <FormGroup className="mb-3">
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </FormGroup>

            <Row className="text-center">
              <Col>
                <Button type="submit" color="primary" className="me-2">
                  Login
                </Button>
                <Button color="secondary" onClick={() => navigate("/signup")}>
                  Sign Up
                </Button>
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>
    </Container>
  );
}
