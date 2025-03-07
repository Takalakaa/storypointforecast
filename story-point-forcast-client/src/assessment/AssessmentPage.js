import React, { useState, useEffect } from "react";
import {
    Container,
    Card,
    Row,
    Col,
    Form,
    Label,
    Input,
    Button,
    FormGroup
} from "reactstrap";
import { useNavigate } from "react-router-dom";

const AssessmentPage = ({ userName }) => {
    const [text, setText] = useState('');
    const [skills, setSkills] = useState({});
    const [skillLevel, setSkillLevel] = useState(0);
    const [editSkill, setEditSkill] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`http://127.0.0.1:5000/developer/${userName}`);

            if (response.ok) {
                const data = await response.json();
                if (data) {
                    setSkills(data);
                }
            } else {
                const storedSkills = sessionStorage.getItem('skills');
                if (storedSkills) {
                    setSkills(JSON.parse(storedSkills));
                }
            }
        };

        fetchData();
    }, [userName]);

    useEffect(() => {
        if (Object.keys(skills).length > 0) {
            sessionStorage.setItem('skills', JSON.stringify(skills));
        } else {
            sessionStorage.removeItem('skills');
        }
    }, [skills]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (editSkill.length !== 0) {
                const level = parseInt(skillLevel, 10);
                if (level >= 0 && level <= 5) {
                    setSkills(prevSkills => {
                        const updatedSkills = { ...prevSkills, [editSkill]: level };
                        return updatedSkills;
                    });
                    setSkillLevel(0);
                    setEditSkill('');
                } else {
                    alert("Skill level must be between 0 and 5");
                }
            } else if (text.trim() !== '') {
                setSkills(prevSkills => {
                    const updatedSkills = { ...prevSkills, [text.trim()]: 0 };
                    return updatedSkills;
                });
                setText('');
            }
        }
    };

    const removeSkill = (skill) => {
        setSkills(prevSkills => {
            const updatedSkills = { ...prevSkills };
            delete updatedSkills[skill];
            return updatedSkills;
        });
    };

    const handleComplete = async () => {
        try {
            const postData = skills;

            const response = await fetch(`http://127.0.0.1:5000/developer/${userName}/skills`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(postData),
            });

            if (response.ok) {
                alert("Skills submitted successfully!");
                navigate("/");
            } else {
                const errorData = await response.json();
                alert(`Failed to submit skills. Error: ${errorData.error || "Unknown error"}`);
            }
        } catch (error) {
            alert("Error: " + error.message);
        }
    };

    return (
        <Container className="mt-5">
            <Card body className="p-4 shadow-sm">
                <h3 className="text-center">Self Assessment</h3>
                <Form>
                    <FormGroup>
                        <Label for="skillInput">Enter Skills and press Enter:</Label>
                        <Input
                            type="text"
                            id="skillInput"
                            value={text}
                            placeholder="Enter Skills"
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </FormGroup>
                    <Row>
                        <Col>
                            <h5 className="mt-3">Skills</h5>
                            {Object.keys(skills).map((skill) => (
                                <Row key={skill} className="align-items-center mb-2">
                                    <Col>
                                        <strong>{skill}:</strong>
                                        {editSkill === skill ? (
                                            <Input
                                                type="number"
                                                value={skillLevel}
                                                onChange={(e) => setSkillLevel(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                min="0"
                                                max="5"
                                            />
                                        ) : (
                                            ` ${skills[skill]}`
                                        )}
                                    </Col>
                                    <Col xs="auto">
                                        <Button size="sm" color="warning" onClick={() => { setEditSkill(skill); setSkillLevel(skills[skill]); }}>Edit</Button>
                                        <Button size="sm" color="danger" className="ms-2" onClick={() => removeSkill(skill)}>Remove</Button>
                                    </Col>
                                </Row>
                            ))}
                        </Col>
                    </Row>

                    <Row className="text-center mt-4">
                        <Col>
                            <Button color="success" onClick={handleComplete}>Complete</Button>
                        </Col>
                    </Row>
                </Form>
            </Card>
        </Container>
    );
};

export default AssessmentPage;
