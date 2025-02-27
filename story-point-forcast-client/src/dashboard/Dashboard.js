import React from "react";
import { Container, Button, Row, Col, Card, CardBody, CardTitle } from "reactstrap";
import { useNavigate } from "react-router-dom";

const Dashboard = ({userName}) => {
    const navigate = useNavigate();

    const handleNavigateToAssessment = () => {
        navigate("/assessment");
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md="8" lg="6">
                    <Card>
                        <CardBody>
                            <CardTitle tag="h3" className="text-center">
                                Welcome to the Dashboard {userName}
                            </CardTitle>
                            <Row className="text-center mt-4">
                                <Col>
                                    <Button
                                        color="primary"
                                        onClick={handleNavigateToAssessment}
                                    >
                                        Go to Assessment Page
                                    </Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Dashboard;
