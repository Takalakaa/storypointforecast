import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button, Card, CardBody, Alert, ListGroup, ListGroupItem } from "reactstrap";

const API_BASE_URL = "http://127.0.0.1:5000";

const PullRequestAnalysis = () => {
    const [owner, setOwner] = useState("Takalakaa");
    const [repo, setRepo] = useState("storypointforecast");
    const [prs, setPrs] = useState([]);
    const [selectedPr, setSelectedPr] = useState("");
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPRs = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/github/prs/${owner}/${repo}`);
                if (!response.ok) throw new Error(`Failed to fetch PRs: ${response.status}`);
                
                const data = await response.json();
                
                if (data && data.data && Array.isArray(data.data)) {
                    setPrs(data.data);
                } else {
                    throw new Error("Unexpected response format");
                }
            } catch (error) {
                setError("Error fetching PRs. Please check repository details.");
            }
        };

        fetchPRs();
    }, [owner, repo]);

    const handleAnalyze = async () => {
        if (!selectedPr) {
            setError("Please select a pull request.");
            return;
        }

        const analyzeUrl = `http://github.com/${owner}/${repo}/pull/${selectedPr}`;

        setError(null);
        try {
            const response = await fetch(analyzeUrl);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server Error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            setAnalysisResult(result);
        } catch (error) {
            setError(`Failed to analyze PR. Server Response: ${error.message}`);
        }
    };

    return (
        <Container className="mt-5">
            <h2 className="text-center mb-4">Pull Request Analysis Tool</h2>

            {error && <Alert color="danger">{error}</Alert>}

            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="p-4 shadow-sm">
                        <Form>
                            <FormGroup>
                                <Label className="fw-bold">Select a Pull Request</Label>
                                <Input 
                                    type="select" 
                                    value={selectedPr} 
                                    onChange={(e) => setSelectedPr(e.target.value)}
                                >
                                    <option value="">Choose a PR...</option>
                                    {prs.length > 0 ? (
                                        prs.map(pr => (
                                            <option key={pr.number} value={pr.number}>
                                                PR #{pr.number} - {pr.title}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>Loading PRs...</option>
                                    )}
                                </Input>
                            </FormGroup>
                            <Button color="primary" block onClick={handleAnalyze}>Analyze PR</Button>
                        </Form>
                    </Card>
                </Col>
            </Row>

            {analysisResult && (
                <Row className="justify-content-center mt-4">
                    <Col md={8} lg={6}>
                        <Card className="p-4 shadow-sm border-primary">
                            <CardBody>
                                <h4 className="text-primary">Analysis Result</h4>
                                <p><strong>Primary Languages Used:</strong> {analysisResult.languages.join(", ")}</p>
                                <p><strong>Development Categories:</strong> {analysisResult.categories.join(", ")}</p>
                                <p><strong>Key Software Development Updates:</strong></p>
                                <ListGroup flush>
                                    {analysisResult.changes.map((change, index) => (
                                        <ListGroupItem key={index} className="border-0">{change}</ListGroupItem>
                                    ))}
                                </ListGroup>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            )}

            {prs.length > 0 && (
                <Row className="justify-content-center mt-5">
                    <Col md={8} lg={6}>
                        <h5 className="text-center">View PRs on GitHub</h5>
                        <ListGroup flush className="shadow-sm">
                            {prs.map(pr => (
                                <ListGroupItem key={pr.number} className="border-0">
                                    <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none fw-bold">
                                        PR #{pr.number} - {pr.title} ({pr.state.toUpperCase()})
                                    </a>
                                </ListGroupItem>
                            ))}
                        </ListGroup>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default PullRequestAnalysis;
