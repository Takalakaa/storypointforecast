import React, { useState, useEffect } from "react";
import { Container, Button, Row, Col, Card, CardBody, CardTitle, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { fetchGitHubProjects } from "../github/GitHubHelper"; 

const Dashboard = ({ userName, gitHub }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("1");
    const [selectedProject, setSelectedProject] = useState(null);
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const loadProjects = async () => {
            const projectList = await fetchGitHubProjects(gitHub);
            setProjects(projectList);
        };

        if (gitHub) {
            loadProjects().catch(error => console.error("Fetch error:", error));
        }
    }, [gitHub]);

    const handleNavigateToAssessment = () => {
        navigate("/assessment");
    };

    const handleProjectSelect = (project) => {
        setSelectedProject(project);
    };

    const toggleTab = (tab) => {
        setActiveTab(tab);
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md="10">
                    <Card>
                        <CardBody>
                            <CardTitle tag="h3" className="text-center">
                                Welcome to the Dashboard: {userName}
                            </CardTitle>
                            <Row className="text-center mt-4">
                                <Col>
                                    <Button color="primary" onClick={handleNavigateToAssessment}>
                                        Go to Assessment Page
                                    </Button>
                                </Col>
                            </Row>

                            {/* Project List */}
                            <Row className="mt-4">
                                <Col>
                                    <h4>Your Contributed GitHub Projects: {gitHub}</h4>
                                    {projects.length > 0 ? (
                                        projects.map((project, index) => (
                                            <Button 
                                                key={index} 
                                                color="secondary" 
                                                className="m-1"
                                                onClick={() => handleProjectSelect(project)}
                                            >
                                                {project.name}
                                            </Button>
                                        ))
                                    ) : (
                                        <p>No public projects found.</p>
                                    )}
                                </Col>
                            </Row>

                            {/* Project Graph Placeholder */}
                            {selectedProject && (
                                <Row className="mt-4">
                                    <Col>
                                        <h4>Performance Overview - {selectedProject.name}</h4>
                                        <div style={{ border: "1px solid #ddd", padding: "20px", textAlign: "center", borderRadius: "10px", backgroundColor: "#f8f9fa" }}>
                                            Graph display coming soon...
                                        </div>
                                    </Col>
                                </Row>
                            )}

                            {/* Sprint Point Tabs */}
                            <Row className="mt-4">
                                <Col>
                                    <Nav tabs className="mb-3">
                                        <NavItem>
                                            <NavLink
                                                style={{
                                                    cursor: "pointer",
                                                    fontWeight: "bold",
                                                    padding: "10px 15px",
                                                    borderRadius: "5px 5px 0 0",
                                                    backgroundColor: activeTab === "1" ? "#007bff" : "#e9ecef",
                                                    color: activeTab === "1" ? "#fff" : "#000",
                                                }}
                                                onClick={() => toggleTab("1")}
                                            >
                                                Table View
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink
                                                style={{
                                                    cursor: "pointer",
                                                    fontWeight: "bold",
                                                    padding: "10px 15px",
                                                    borderRadius: "5px 5px 0 0",
                                                    backgroundColor: activeTab === "2" ? "#007bff" : "#e9ecef",
                                                    color: activeTab === "2" ? "#fff" : "#000",
                                                }}
                                                onClick={() => toggleTab("2")}
                                            >
                                                Chart View
                                            </NavLink>
                                        </NavItem>
                                    </Nav>
                                    <TabContent activeTab={activeTab} className="mt-3 p-3 border rounded" style={{ backgroundColor: "#f8f9fa" }}>
                                        <TabPane tabId="1">
                                            <p>Table format of sprint data coming soon...</p>
                                        </TabPane>
                                        <TabPane tabId="2">
                                            <p>Chart format of sprint data coming soon...</p>
                                        </TabPane>
                                    </TabContent>
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
