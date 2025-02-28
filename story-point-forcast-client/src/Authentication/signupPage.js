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
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Modal,
    ModalHeader,
    ModalBody,
} from "reactstrap";
import { useNavigate } from "react-router-dom";

export default function Signup({ onLogin }) {
    const baseUrl = "http://localhost:5000";
    const [username, setUsername] = useState("");
    const [git_uname, setGitUname] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const navigate = useNavigate();

    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
    const togglePasswordModal = () => setPasswordModalOpen(!passwordModalOpen);
    const toggleErrorModal = () => setErrorModalOpen(!errorModalOpen);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!role) {
            alert("Please select a role before signing up.");
            return;
        }
        signup();
    };

    const signup = async () => {
        if (password !== confirmPassword) {
            togglePasswordModal();
            return;
        }
        const route = `${baseUrl}/signup`;
        const response = await fetch(route, {
            method: "POST",
            headers: { "Content-type": "application/json; charset=UTF-8" },
            body: JSON.stringify({ name: username, git_uname, password, role }),
        });

        if (response.status === 200) {
            console.log("Signup successful");
            loginAfterSignup();
        } else if (response.status === 201) {
            toggleErrorModal();
        }
    };

    const loginAfterSignup = async () => {
        const route = `${baseUrl}/login`;
        const response = await fetch(route, {
            method: "POST",
            headers: { "Content-type": "application/json; charset=UTF-8" },
            body: JSON.stringify({ name: username, password, action: "login" }),
        });

        if (response.status === 200) {
            const data = await response.json();
            if (data !== 0) {
                onLogin(data);
                navigate("/");
            }
        } else {
            toggleErrorModal();
        }
    };

    return (
        <Container className="mt-4">
            <Card style={{ maxWidth: "500px", margin: "auto" }}>
                <CardBody>
                    <h3 className="text-center">Signup</h3>
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
                            <Label htmlFor="git-uname">Github Username</Label>
                            <Input
                                type="text"
                                id="git-uname"
                                value={git_uname}
                                onChange={(e) => setGitUname(e.target.value)}
                                required
                            />
                        </FormGroup>

                        <Row>
                            <Col sm="12" md="6">
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
                            </Col>
                            <Col sm="12" md="6">
                                <FormGroup className="mb-3">
                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                    <Input
                                        type="password"
                                        id="confirm-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </FormGroup>
                            </Col>
                        </Row>

                        <FormGroup className="mb-3">
                            <Label>Role</Label>
                            <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
                                <DropdownToggle caret color="secondary" block>
                                    {role || "Select Role"}
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem onClick={() => setRole("Admin")}>Admin</DropdownItem>
                                    <DropdownItem onClick={() => setRole("Project Manager")}>
                                        Project Manager
                                    </DropdownItem>
                                    <DropdownItem onClick={() => setRole("Developer")}>Developer</DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </FormGroup>

                        <Row className="text-center">
                            <Col>
                                <Button type="submit" color="primary" className="me-2">
                                    Sign up
                                </Button>
                                <Button color="secondary" onClick={() => navigate("/login")}>
                                    Login
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </CardBody>
            </Card>

            <Modal isOpen={passwordModalOpen} toggle={togglePasswordModal}>
                <ModalHeader toggle={togglePasswordModal}>Passwords do not match</ModalHeader>
                <ModalBody>Looks like your passwords do not match, please try again.</ModalBody>
            </Modal>

            <Modal isOpen={errorModalOpen} toggle={toggleErrorModal}>
                <ModalHeader toggle={toggleErrorModal}>User already exists</ModalHeader>
                <ModalBody>A user by that name with that role already exists.</ModalBody>
            </Modal>
        </Container>
    );
}
