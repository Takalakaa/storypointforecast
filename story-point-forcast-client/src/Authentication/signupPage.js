import React, { useState } from 'react';
import { 
    Col,
    Form, 
    Card, 
    Button, 
    Row, 
    Dropdown, 
    DropdownItem, 
    DropdownMenu, 
    DropdownToggle, 
    Label,
    Input,
    Modal,
    ModalHeader,
    ModalBody,
    Container} from 'reactstrap';


export default function Signup() {
  const baseUrl = "http://localhost:5000"
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm_passoword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  const toggle = () => setDropdownOpen(!dropdownOpen);
  const passwordModalToggle = () => setPasswordModalOpen(!passwordModalOpen);
  const errorModalToggle = () => setErrorModalOpen(!errorModalOpen);

  const handleSubmit = async (event) => {
    event.preventDefault();
    signup();
  };

  const signup = async () => {
    if(confirm_passoword != password){
        passwordModalToggle();
        return "0";
    }
    let route = baseUrl + "/signup"
    const response = await fetch (route, {
        method: 'POST',
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({
          name: username,
          password: password,
          role: role,
        }),
        
    })
    .then(
        (response) => 
        {
            if (response.status === 200){
                return (["status ", response.status]) ;
            }
            else
                if(response.status === 201)
                    errorModalToggle();
                    return (["status ", response.status]);
        }
      )
  }
  return (
    <Container>
        <Card>
        <Col>
            <h2>Signup</h2>
            <Form onSubmit={handleSubmit}>
            <Row>
                <Col>
                    <Label htmlFor="username">Username:</Label>
                    <Input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    />
                </Col>
            </Row>
            <Row>
                <Col>
                    <Label htmlFor="password">Password:</Label>
                    <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    />
                </Col>
            </Row>
            <Row>
                <Col>
                    <Label htmlFor="password">Confirm Password:</Label>
                    <Input
                    type="password"
                    id="confirm-password"
                    value={confirm_passoword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    />
                </Col>
            </Row>
            <Row>
                <Col>
                    <Dropdown isOpen={dropdownOpen} toggle={toggle} onChange={(e) => setRole(e.target.value)}>
                        <DropdownToggle caret size="lg">
                            {role || 'Select Role'}
                        </DropdownToggle>
                        <DropdownMenu>
                            <DropdownItem onClick={(e) => setRole(e.target.value)} value="Admin">Admin</DropdownItem>
                            <DropdownItem onClick={(e) => setRole(e.target.value)} value="Project Manager">Project Manager</DropdownItem>
                            <DropdownItem onClick={(e) => setRole(e.target.value)} value="Developer">Developer</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </Col>
            </Row>
            <Button type="submit">Sign up</Button>
            </Form>
        </Col>
        </Card>
        <Modal isOpen={passwordModalOpen} toggle={passwordModalToggle}>
            <ModalHeader toggle={passwordModalToggle}>Passwords do not match</ModalHeader>
            <ModalBody>
                Looks like your passwords do not match please try again.
            </ModalBody>
        </Modal>
        <Modal isOpen={errorModalOpen} toggle={errorModalToggle}>
            <ModalHeader toggle={errorModalToggle}>User already exists</ModalHeader>
            <ModalBody>
                A user by that name with that role already exists.
            </ModalBody>
        </Modal>
    </Container>
  );
};