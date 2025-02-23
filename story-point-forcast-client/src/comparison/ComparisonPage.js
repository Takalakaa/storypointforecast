import React, { useState, useEffect } from "react";
import { Card, CardBody, CardTitle, CardText, Container, Row, Col, Spinner, Input, Button } from "reactstrap";

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

const calculateSimilarity = (skills1, skills2) => {
    const allSkills = new Set([...Object.keys(skills1), ...Object.keys(skills2)]);
    if (allSkills.size === 0) return 0;
    
    let totalDifference = 0;
    let sharedSkillsCount = 0;
    
    allSkills.forEach(skill => {
        if (skills1[skill] !== undefined && skills2[skill] !== undefined) {
            totalDifference += Math.abs(skills1[skill] - skills2[skill]);
            sharedSkillsCount++;
        }
    });
    
    const maxDifference = sharedSkillsCount * 5;
    const similarityScore = maxDifference > 0 ? (1 - totalDifference / maxDifference) * 100 : 0;
    
    return similarityScore;
};

const SkillsComparison = () => {
    const [developer1, setDeveloper1] = useState("");
    const [developer2, setDeveloper2] = useState("");
    const [data1, setData1] = useState(null);
    const [data2, setData2] = useState(null);
    const [loading, setLoading] = useState(false);
    const [similarity, setSimilarity] = useState(null);

    const fetchDeveloperData = async (userName, setData) => {
        try {
            const response = await fetch(`http://localhost:5000/developer/${userName}`);
            if (!response.ok) throw new Error("Failed to fetch data");
            const data = await response.json();
            setData(data);
        } catch (error) {
            console.error("Error fetching data:", error);
            setData(null);
        }
    };

    const handleCompare = async () => {
        if (!developer1 || !developer2) return;
        setLoading(true);
        await Promise.all([fetchDeveloperData(developer1, setData1), fetchDeveloperData(developer2, setData2)]);
        setLoading(false);
    };

    useEffect(() => {
        if (data1 && data2) {
            setSimilarity(calculateSimilarity(data1, data2));
        }
    }, [data1, data2]);

    const sharedSkills = [];
    const uniqueSkills1 = [];
    const uniqueSkills2 = [];
    
    if (data1 && data2) {
        new Set([...Object.keys(data1), ...Object.keys(data2)]).forEach(skill => {
            if (data1[skill] !== undefined && data2[skill] !== undefined) {
                sharedSkills.push(skill);
            } else if (data1[skill] !== undefined) {
                uniqueSkills1.push(skill);
            } else {
                uniqueSkills2.push(skill);
            }
        });
    }

    return (
        <Container className="mt-5 text-center">
            <Row className="mb-4 justify-content-center">
                <Col md="5">
                    <Input placeholder="Developer 1" value={developer1} onChange={e => setDeveloper1(e.target.value)} />
                </Col>
                <Col md="5">
                    <Input placeholder="Developer 2" value={developer2} onChange={e => setDeveloper2(e.target.value)} />
                </Col>
                <Col md="2">
                    <Button color="primary" onClick={handleCompare} disabled={loading}>Compare</Button>
                </Col>
            </Row>
            {loading && <Spinner color="primary" />} 
            {similarity !== null && (
                <Card className="mt-4 text-center">
                    <CardBody>
                        <CardTitle tag="h4">Similarity Score</CardTitle>
                        <CardText className="display-4 font-weight-bold">{similarity.toFixed(2)}%</CardText>
                        <CardText>Similarity is calculated based on shared skills and their level differences. The formula used:</CardText>
                        <CardText className="font-italic">(1 - Total Difference / (Shared Skills × 5)) × 100</CardText>
                        <h5>Shared Skills</h5>
                        <Row>
                            <Col md="6">
                                <h6>{developer1}</h6>
                                {sharedSkills.map(skill => (
                                    <Card key={skill} style={{ backgroundColor: getColorFromHash(generateHash(skill)), color: "#fff", marginBottom: "10px" }}>
                                        <CardBody>
                                            <CardTitle tag="h6">{skill.charAt(0).toUpperCase() + skill.slice(1)}</CardTitle>
                                            <CardText>{data1[skill]} / 5</CardText>
                                        </CardBody>
                                    </Card>
                                ))}
                            </Col>
                            <Col md="6">
                                <h6>{developer2}</h6>
                                {sharedSkills.map(skill => (
                                    <Card key={skill} style={{ backgroundColor: getColorFromHash(generateHash(skill)), color: "#fff", marginBottom: "10px" }}>
                                        <CardBody>
                                            <CardTitle tag="h6">{skill.charAt(0).toUpperCase() + skill.slice(1)}</CardTitle>
                                            <CardText>{data2[skill]} / 5</CardText>
                                        </CardBody>
                                    </Card>
                                ))}
                            </Col>
                        </Row>
                        <h5 className="mt-4">Unique Skills</h5>
                        <Row>
                            <Col md="6">
                                {uniqueSkills1.map(skill => (
                                    <Card key={skill} style={{ backgroundColor: getColorFromHash(generateHash(skill)), color: "#fff", marginBottom: "10px" }}>
                                        <CardBody>
                                            <CardTitle tag="h6">{skill.charAt(0).toUpperCase() + skill.slice(1)}</CardTitle>
                                            <CardText>{data1[skill]} / 5</CardText>
                                        </CardBody>
                                    </Card>
                                ))}
                            </Col>
                            <Col md="6">
                                {uniqueSkills2.map(skill => (
                                    <Card key={skill} style={{ backgroundColor: getColorFromHash(generateHash(skill)), color: "#fff", marginBottom: "10px" }}>
                                        <CardBody>
                                            <CardTitle tag="h6">{skill.charAt(0).toUpperCase() + skill.slice(1)}</CardTitle>
                                            <CardText>{data2[skill]} / 5</CardText>
                                        </CardBody>
                                    </Card>
                                ))}
                            </Col>
                        </Row>
                    </CardBody>
                </Card>
            )}
        </Container>
    );
};

export default SkillsComparison;
