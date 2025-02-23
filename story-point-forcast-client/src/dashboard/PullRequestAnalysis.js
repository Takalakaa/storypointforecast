import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button, Card, CardBody, Alert, ListGroup, ListGroupItem, Spinner } from "reactstrap";

const API_BASE_URL = "http://127.0.0.1:5000";

const PullRequestAnalysis = () => {
    const [owner, setOwner] = useState("Takalakaa");
    const [repo, setRepo] = useState("storypointforecast");
    const [prs, setPrs] = useState([]);
    const [selectedPr, setSelectedPr] = useState("");
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

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

        setLoading(true);
        setError(null);
        setAnalysisResult(null);

        const analyzeUrl = `${API_BASE_URL}/github/analyze_pr/${owner}/${repo}/${selectedPr}`;

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
        } finally {
            setLoading(false);
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
                            <Button color="primary" block onClick={handleAnalyze} disabled={loading}>
                                {loading ? <Spinner size="sm" /> : "Analyze PR"}
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>

            {loading && (
                <Row className="justify-content-center mt-4">
                    <Col md={8} lg={6} className="text-center">
                        <Spinner color="primary" />
                        <p>Analyzing PR... Please wait.</p>
                    </Col>
                </Row>
            )}

            {analysisResult && (
                <Row className="justify-content-center mt-4">
                    <Col md={8} lg={6}>
                        <Card className="p-4 shadow-sm border-primary">
                            <CardBody>
                                <h4 className="text-primary">Analysis Result</h4>
                                <p><strong>Files Changed:</strong></p>
                                <ListGroup flush>
                                    {analysisResult.files_changed.map((file, index) => (
                                        <ListGroupItem key={index} className="border-0">{file}</ListGroupItem>
                                    ))}
                                </ListGroup>
                                <p><strong>GPT Analysis:</strong></p>
                                <p>{analysisResult.gpt_analysis}</p>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default PullRequestAnalysis;