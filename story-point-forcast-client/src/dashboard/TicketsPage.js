import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardHeader,
  CardBody,
  CardSubtitle,
  Badge,
  ListGroup,
  ListGroupItem,
  Spinner,
  Alert,
  Button,
  Row,
  Col,
  Progress,
  Tooltip
} from 'reactstrap';

const TicketsPage = () => {
  const { owner, repo, username } = useParams();
  const [tickets, setTickets] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [adjustedEstimates, setAdjustedEstimates] = useState({});
  const [tooltipOpen, setTooltipOpen] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, [owner, repo]);

  // Add this effect to fetch adjusted estimates when tickets change
  useEffect(() => {
    if (Object.keys(tickets).length > 0) {
      fetchAdjustedEstimates();
    }
  }, [tickets]);

  const toggleTooltip = (id) => {
    setTooltipOpen(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const url = `http://127.0.0.1:5000/github/project/${owner}/${repo}`;
      
      console.log(`Fetching tickets from: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log("Tickets received:", data.columns);
        
        // Add unique IDs to tickets if they don't have them
        const ticketsWithIds = {};
        Object.entries(data.columns || {}).forEach(([status, ticketList]) => {
          ticketsWithIds[status] = ticketList.map(ticket => ({
            ...ticket,
            id: ticket.id || `${ticket.title}-${Math.random().toString(36).substr(2, 9)}`
          }));
        });
        
        setTickets(ticketsWithIds);
        setProjectName(data.project_name || `${owner}/${repo} Project`);
        
        // Set the first available status as active tab, or 'all' if no statuses
        const statuses = Object.keys(data.columns || {});
        if (statuses.length > 0) {
          setActiveTab(statuses[0]);
        } else {
          setActiveTab('all');
        }
      } else {
        setError(data.error || 'Failed to fetch tickets');
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError(err.message || 'An error occurred while fetching tickets');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAdjustedEstimates = async () => {
    try {
      // Flatten tickets for API call
      const allTickets = [];
      Object.entries(tickets).forEach(([status, ticketList]) => {
        ticketList.forEach(ticket => {
          allTickets.push({
            id: ticket.id,
            title: ticket.title,
            estimate: ticket.estimate,
            skills: ticket.skills || []
          });
        });
      });
      
      // Skip API call if no tickets have estimates or skills
      const ticketsWithEstimates = allTickets.filter(t => 
        t.estimate !== undefined && t.estimate !== null && 
        t.skills && t.skills.length > 0
      );
      
      if (ticketsWithEstimates.length === 0) {
        return;
      }
      
      // Call the API
      const response = await fetch('http://127.0.0.1:5000/calculate/adjusted-estimate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tickets: ticketsWithEstimates,
          username: username // Use this if available in your component
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Create a map for quick lookups
        const adjustedMap = {};
        data.tickets.forEach(ticket => {
          adjustedMap[ticket.id] = ticket;
        });
        
        setAdjustedEstimates(adjustedMap);
      }
    } catch (err) {
      console.error("Error calculating adjusted estimates:", err);
      // Continue with original estimates
    }
  };
  
  const getStatusColor = (status) => {
    const statusMap = {
      'To Do': 'secondary',
      'Backlog': 'secondary',
      'In Progress': 'primary',
      'In Review': 'info',
      'Done': 'success',
      'Blocked': 'danger',
      'Sprint Backlog': 'warning'
    };
    
    return statusMap[status] || 'secondary';
  };
  
  const getSkillColor = (skill) => {
    const colorMap = {
      'java': 'warning',
      'python': 'success',
      'react': 'info',
      'javascript': 'warning',
      'html': 'danger',
      'css': 'primary',
      'api': 'dark',
      'database': 'secondary'
    };
    
    return colorMap[skill.toLowerCase()] || 'secondary';
  };
  
  // Add this function to determine the color for adjusted estimates
  const getComparisonColor = (original, adjusted) => {
    if (adjusted > original) return "danger";  // More difficult than expected
    if (adjusted < original) return "success"; // Easier than expected
    return "secondary";                        // As expected
  };
  
  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner color="primary" />
        <p>Loading tickets for {owner}/{repo}...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="mt-5">
        <Alert color="danger">
          {error}
        </Alert>
        <Button color="primary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  // Calculate metrics only if there are tickets
  const statuses = Object.keys(tickets);
  const totalTickets = Object.values(tickets).reduce((sum, ticketList) => sum + ticketList.length, 0);
  
  // Prepare flat list of all tickets for "All" view
  const allTickets = Object.entries(tickets).flatMap(([status, ticketList]) => 
    ticketList.map(ticket => ({...ticket, status}))
  );
  
  // Calculate completed tickets and estimate metrics
  const completedTickets = tickets['Done']?.length || 0;
  const inProgressTickets = tickets['In Progress']?.length || 0;
  
  // Calculate total and completed estimate points
  let totalEstimatePoints = 0;
  let completedPoints = 0;
  let inProgressPoints = 0;
  
  // Add these for adjusted points
  let totalAdjustedPoints = 0;
  let completedAdjustedPoints = 0;
  let inProgressAdjustedPoints = 0;
  
  Object.entries(tickets).forEach(([status, ticketList]) => {
    ticketList.forEach(ticket => {
      const estimate = ticket.estimate || 0;
      totalEstimatePoints += estimate;
      
      // Get adjusted estimate if available
      const adjustedTicket = adjustedEstimates[ticket.id];
      const adjustedEstimate = adjustedTicket?.adjustedEstimate || estimate;
      totalAdjustedPoints += adjustedEstimate;
      
      if (status === 'Done') {
        completedPoints += estimate;
        completedAdjustedPoints += adjustedEstimate;
      } else if (status === 'In Progress') {
        inProgressPoints += estimate;
        inProgressAdjustedPoints += adjustedEstimate;
      }
    });
  });
  
  const percentComplete = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0;
  const pointsPercentComplete = totalEstimatePoints > 0 ? 
    Math.round((completedPoints / totalEstimatePoints) * 100) : 0;
  
  // Determine which tickets to display based on active tab
  const displayTickets = activeTab === 'all' 
    ? allTickets 
    : tickets[activeTab] || [];

  return (
    <Container className="mt-4">
      <Card className="mb-4 shadow-sm">
        <CardHeader className="bg-primary text-white">
          <Row className="align-items-center">
            <Col>
              <h2 className="mb-0">{projectName}</h2>
              <CardSubtitle>
                All tickets in {owner}/{repo}
              </CardSubtitle>
            </Col>
            <Col xs="auto">
              <Button color="light" onClick={() => navigate(-1)}>
                Back
              </Button>
            </Col>
          </Row>
        </CardHeader>
        
        <CardBody>
          {totalTickets === 0 ? (
            <Alert color="info">
              No tickets found in this project.
            </Alert>
          ) : (
            <>
              
              {/* Status Filter Buttons */}
              <div className="mb-4 d-flex flex-wrap">
                <Button
                  color={activeTab === 'all' ? 'primary' : 'outline-primary'}
                  className="mr-2 mb-2"
                  onClick={() => setActiveTab('all')}
                >
                  All Tickets ({totalTickets})
                </Button>
                
                {statuses.map(status => (
                  <Button
                    key={status}
                    color={activeTab === status ? getStatusColor(status) : `outline-${getStatusColor(status)}`}
                    className="mr-2 mb-2"
                    onClick={() => setActiveTab(status)}
                  >
                    {status} ({tickets[status].length})
                  </Button>
                ))}
              </div>
            </>
          )}
          
          {/* Tickets List */}
          {displayTickets.length === 0 ? (
            <Alert color="info">
              No tickets found in this category.
            </Alert>
          ) : (
            <ListGroup className="shadow-sm">
              {displayTickets.map((ticket, index) => {
                // Generate a unique ID for this ticket if it doesn't have one
                const ticketId = ticket.id || `ticket-${index}`;
                // Generate a unique tooltip ID that's safe for CSS selectors (no spaces, colons, etc.)
                const tooltipId = `tooltip-${index}-${Math.random().toString(36).substring(2, 8)}`;
                
                return (
                  <ListGroupItem key={index} className="mb-2 border rounded">
                    <Row>
                      <Col md="7">
                        <div>
                          <h5 className="mb-0">
                            <a 
                              href={ticket.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary"
                            >
                              {ticket.title}
                            </a>
                          </h5>
                          
                          {/* Display estimate with Original and Adjusted values */}
                          {ticket.estimate !== null && ticket.estimate !== undefined && (
                            <div className="mt-2">
                              <strong>Original Estimate:</strong>{" "}
                              <Badge 
                                color="dark" 
                                pill
                                style={{ fontSize: '0.9rem', padding: '0.2rem 0.5rem' }}
                              >
                                {ticket.estimate}
                              </Badge>
                              
                              {adjustedEstimates[ticketId] && (
                                <>
                                  {" "}
                                  <strong>Adjusted:</strong>{" "}
                                  <Badge 
                                    color={getComparisonColor(
                                      ticket.estimate, 
                                      adjustedEstimates[ticketId].adjustedEstimate
                                    )} 
                                    pill
                                    style={{ fontSize: '0.9rem', padding: '0.2rem 0.5rem' }}
                                    id={tooltipId}
                                  >
                                    {adjustedEstimates[ticketId].adjustedEstimate}
                                    {" "}
                                    {adjustedEstimates[ticketId].adjustedEstimate > ticket.estimate ? "↑" : 
                                     adjustedEstimates[ticketId].adjustedEstimate < ticket.estimate ? "↓" : ""}
                                    {" "}
                                    {Math.abs(Math.round(((adjustedEstimates[ticketId].adjustedEstimate - ticket.estimate) / ticket.estimate) * 100))}%
                                  </Badge>
                                  
                                  <Tooltip 
                                    placement="top" 
                                    isOpen={tooltipOpen[tooltipId]} 
                                    target={tooltipId} 
                                    toggle={() => toggleTooltip(tooltipId)}
                                  >
                                    Based on skill difficulty: {ticket.skills?.join(', ')}
                                  </Tooltip>
                                </>
                              )}
                            </div>
                          )}
                          
                          {/* Display skills */}
                          {ticket.skills && ticket.skills.length > 0 && (
                            <div className="mt-2">
                              <strong>Skills:</strong>{" "}
                              {ticket.skills.map((skill, skillIndex) => (
                                <Badge 
                                  key={skillIndex} 
                                  color={getSkillColor(skill)} 
                                  className="mr-1"
                                  pill
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </Col>
                      
                      <Col md="2">
                        {activeTab === 'all' && (
                          <Badge color={getStatusColor(ticket.status)} className="mr-2">
                            {ticket.status}
                          </Badge>
                        )}
                      </Col>
                      
                      <Col md="3" className="text-right">
                        {ticket.assignees && ticket.assignees.length > 0 ? (
                          <div>
                            <strong>Assignees:</strong><br />
                            {ticket.assignees.map((assignee, i) => (
                              <Badge 
                                key={i} 
                                color="info" 
                                className="mx-1 my-1"
                                pill
                              >
                                @{assignee}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <Badge color="light">Unassigned</Badge>
                        )}
                      </Col>
                    </Row>
                  </ListGroupItem>
                );
              })}
            </ListGroup>
          )}
        </CardBody>
      </Card>
    </Container>
  );
};

export default TicketsPage;