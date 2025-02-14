import React, { useState } from 'react';
import { Col, Form, Card, Button, Row, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Label, Input, Modal, ModalHeader, ModalBody, Container } from 'reactstrap';
import { useNavigate } from 'react-router-dom';

export default function Signup({ onLogin }) {
  const baseUrl = "http://127.0.0.1:5000";
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm_password, setConfirmPassword] = useState('');
  const [role, setRole] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const navigate = useNavigate(); // Hook for navigation

  const toggle = () => setDropdownOpen(!dropdownOpen);
  const passwordModalToggle = () => setPasswordModalOpen(!passwordModalOpen);
  const errorModalToggle = () => setErrorModalOpen(!errorModalOpen);

  const handleSubmit = async (event) => {
    event.preventDefault();
    signup();
  };

  const signup = async () => {
    if (confirm_password !== password) {
        passwordModalToggle();
        return;
    }
    let route = baseUrl + "/signup";
    const response = await fetch(route, {
        method: 'POST',
        headers: { "Content-type": "application/json; charset=UTF-8" },
        body: JSON.stringify({ name: username, password: password, role: role }),
        mode: 'cors'
    });

    if (response.status === 200) {
        console.log("Signup successful");
        loginAfterSignup();
    } else if (response.status === 201) {
        errorModalToggle();
    }
  };

const loginAfterSignup = async () => {
    const route = baseUrl + "/login"; 
    const response = await fetch(route, {
      method: 'POST',
      headers: { "Content-type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ name: username, password: password, action: "login" }),
    });
  
    if (response.status === 200) {
        const data = await response.json();
        if (data !== 0) {
          onLogin(data); // Set token in Router.js
          navigate("/"); // Redirect to home after login
        }
    } else {
      errorModalToggle(); // Handle error if login fails
    }
  };

  return (
    <Container>
        <Card>
        <Col>
            <h2>Signup</h2>
            <Form onSubmit={handleSubmit}>
                <Row>
                    <Col>
                        <Label htmlFor="username">Username:</Label>
                        <Input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Label htmlFor="password">Password:</Label>
                        <Input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Label htmlFor="confirm-password">Confirm Password:</Label>
                        <Input type="password" id="confirm-password" value={confirm_password} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Dropdown isOpen={dropdownOpen} toggle={toggle}>
                            <DropdownToggle caret size="lg">
                                {role || 'Select Role'}
                            </DropdownToggle>
                            <DropdownMenu>
                                <DropdownItem onClick={() => setRole("Admin")}>Admin</DropdownItem>
                                <DropdownItem onClick={() => setRole("Project Manager")}>Project Manager</DropdownItem>
                                <DropdownItem onClick={() => setRole("Developer")}>Developer</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </Col>
                </Row>
                <Row className="mt-3">
                    <Col>
                        <Button type="submit" color="primary" block>Sign up</Button>
                    </Col>
                    <Col>
                        <Button color="secondary" block onClick={() => navigate('/login')}>
                            Switch to Login
                        </Button>
                    </Col>
                </Row>
            </Form>
        </Col>
        </Card>

        {/* Modals for error handling */}
        <Modal isOpen={passwordModalOpen} toggle={passwordModalToggle}>
            <ModalHeader toggle={passwordModalToggle}>Passwords do not match</ModalHeader>
            <ModalBody>Looks like your passwords do not match, please try again.</ModalBody>
        </Modal>
        <Modal isOpen={errorModalOpen} toggle={errorModalToggle}>
            <ModalHeader toggle={errorModalToggle}>User already exists</ModalHeader>
            <ModalBody>A user by that name with that role already exists.</ModalBody>
        </Modal>
    </Container>
  );
};