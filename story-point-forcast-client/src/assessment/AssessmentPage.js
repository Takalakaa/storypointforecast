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
    const [tags, setTags] = useState({});
    const [skillLevel, setSkillLevel] = useState(0);
    const [editTag, setEditTag] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`http://localhost:5000/developer/${userName}`);

            if (response.ok) {
                const data = await response.json();
                if (data) {
                    setTags(data);
                }
            } else {
                const skills = sessionStorage.getItem('skills');
                if (skills) {
                    setTags(JSON.parse(skills));
                }
            }
        };

        fetchData();
    }, [userName]);

    useEffect(() => {
        if (Object.keys(tags).length > 0) {
            sessionStorage.setItem('skills', JSON.stringify(tags));
        } else {
            sessionStorage.removeItem('skills');
        }
    }, [tags]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (editTag.length !== 0) {
                const level = parseInt(skillLevel, 10);
                if (level >= 0 && level <= 5) {
                    setTags(prevTags => {
                        const updatedTags = { ...prevTags, [editTag]: level };
                        sessionStorage.setItem('skills', JSON.stringify(updatedTags));  // Only update sessionStorage when tags are updated
                        return updatedTags;
                    });
                    setSkillLevel(0);
                    setEditTag('');
                } else {
                    alert("Skill level must be between 0 and 5");
                }
            } else if (text.trim() !== '') {
                setTags(prevTags => {
                    const updatedTags = { ...prevTags, [text.trim()]: 0 };
                    sessionStorage.setItem('skills', JSON.stringify(updatedTags));  // Only update sessionStorage when tags are updated
                    return updatedTags;
                });
                setText('');
            }
        }
    };

    const removeTag = (tag) => {
        setTags(prevTags => {
            const updatedTags = { ...prevTags };
            delete updatedTags[tag];
            sessionStorage.setItem('skills', JSON.stringify(updatedTags));  // Update sessionStorage after removing a tag
            return updatedTags;
        });
    };

    const handleComplete = async () => {
        try {
            const postData = tags;

            const response = await fetch(`http://localhost:5000/developer/${userName}/skills`, {
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
                <h3 className="text-center">Tag Input</h3>
                <Form>
                    <FormGroup>
                        <Label for="tagInput">Enter tags and press Enter:</Label>
                        <Input
                            type="text"
                            id="tagInput"
                            value={text}
                            placeholder="Enter tags"
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </FormGroup>
                    <Row>
                        <Col>
                            <h5 className="mt-3">Tags</h5>
                            {Object.keys(tags).map((tag) => (
                                <Row key={tag} className="align-items-center mb-2">
                                    <Col>
                                        <strong>{tag}:</strong>
                                        {editTag === tag ? (
                                            <Input
                                                type="number"
                                                value={skillLevel}
                                                onChange={(e) => setSkillLevel(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                min="0"
                                                max="5"
                                            />
                                        ) : (
                                            ` ${tags[tag]}`
                                        )}
                                    </Col>
                                    <Col xs="auto">
                                        <Button size="sm" color="warning" onClick={() => { setEditTag(tag); setSkillLevel(tags[tag]); }}>Edit</Button>
                                        <Button size="sm" color="danger" className="ms-2" onClick={() => removeTag(tag)}>Remove</Button>
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
