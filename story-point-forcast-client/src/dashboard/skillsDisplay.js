import React, { useState, useEffect } from "react";
import {
    Card,
    CardBody,
    CardTitle,
    CardText,
    Container,
    Row,
    Col,
    Spinner,
    Modal,
    ModalHeader,
    ModalBody,
    Button,
} from "reactstrap";
import { useNavigate } from "react-router-dom";

const generateHash = (skillName) => {
    let hash = 0;
    for (let i = 0; i < skillName.length; i++) {
        hash = (hash << 5) - hash + skillName.charCodeAt(i);
    }
    return hash;
};

const getColorFromHash = (hash) => {
    const r = (hash & 0xFF0000) >> 16;
    const g = (hash & 0x00FF00) >> 8;
    const b = hash & 0x0000FF;

    return `rgb(${(r % 255)}, ${(g % 255)}, ${(b % 255)})`;
};

const SkillsDisplay = ({ userName }) => {
    const [developerData, setDeveloperData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const navigate = useNavigate();

    const toggleErrorModal = () => setErrorModalOpen(!errorModalOpen);

    useEffect(() => {
        const fetchDeveloperData = async () => {
            if (!userName) {
                console.log("No username provided");
                setLoading(false);
                return;
            }

            try {
                console.log(`Fetching data for ${userName}`);
                const response = await fetch(`http://localhost:5000/developer/${userName}`);
                console.log("Response received", response);

                if (!response.ok) {
                    throw new Error('Failed to fetch developer data');
                }

                const data = await response.json();
                console.log("Developer data:", data);
                setDeveloperData(data);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message);
                toggleErrorModal();
            } finally {
                setLoading(false);
            }
        };

        fetchDeveloperData();
    }, [userName]);

    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner color="primary" />
                <p>Loading developer data...</p>
            </Container>
        );
    }

    const renderSkills = () => {
        if (developerData && Object.keys(developerData).length > 0) {
            return Object.keys(developerData).map((skill, index) => {
                const hash = generateHash(skill);
                const color = getColorFromHash(hash);

                return (
                    <Col key={index} sm="12" md="4" className="mb-4">
                        <Card
                            style={{
                                backgroundColor: color,
                                color: "#fff",
                            }}
                        >
                            <CardBody>
                                <CardTitle tag="h5">{skill.charAt(0).toUpperCase() + skill.slice(1)}</CardTitle>
                                <CardText>
                                    Skill Level: {developerData[skill]} / 5
                                </CardText>
                            </CardBody>
                        </Card>
                    </Col>
                );
            });
        }
        return <CardText>No skills available</CardText>;
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md="8" lg="6">
                    <Card>
                        <CardBody>
                            <CardTitle tag="h2" className="text-center">Skills</CardTitle>
                            {developerData ? (
                                <div>
                                    <CardText>
                                        <strong>Name:</strong> {userName}
                                    </CardText>
                                    <Row>
                                        {renderSkills()}
                                    </Row>
                                </div>
                            ) : (
                                <CardText>No developer data available</CardText>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            <Modal isOpen={errorModalOpen} toggle={toggleErrorModal}>
                <ModalHeader toggle={toggleErrorModal}>Error</ModalHeader>
                <ModalBody>{error ? error : "An unknown error occurred."}</ModalBody>
                <Button color="primary" onClick={() => navigate('/')}>
                    Go Back
                </Button>
            </Modal>
        </Container>
    );
};

export default SkillsDisplay;
