import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardTitle, Table, Spinner, Alert, Toast, ToastHeader, ToastBody } from 'reactstrap';

export default function ProjectView({userName}) {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gitName, setGitName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showToast, setShowToast] = useState(false);
  
  const handleAnalyze = (owner, repoName, username) => {
    setAnalyzing(true);
    setShowToast(false);
    setAnalysisResult(null);
    
    console.log(`Analyzing: ${owner}/${repoName} for user ${username}`);
    fetch(`http://127.0.0.1:5000/github/analyze/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/${encodeURIComponent(username)}`, {
      method: 'POST',
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setAnalysisResult(data);
        setShowToast(true);
      })
      .catch(err => {
        setError(err.message || 'An error occurred during analysis');
      })
      .finally(() => {
        setAnalyzing(false);
      });
  };
  
  useEffect(() => {
    if (userName) {
      fetch(`http://127.0.0.1:5000/gitUserName/${userName}`)
        .then(response => response.text())
        .then(data => {
          if (data) {
            setGitName(data);
          } else {
            setError('No GitHub username found for this user');
          }
        })
        .catch(err => {
          console.error("Error fetching gitName:", err);
          setError('Failed to fetch GitHub username');
        });
    } else {
      setError('No username provided');
      setLoading(false);
    }
  }, [userName]);
  
  useEffect(() => {
    if (gitName) {
      setLoading(true);
      
      fetch(`http://127.0.0.1:5000/github/contributions/${gitName}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data.success) {
            setContributions(data.data);
            setError(null);
          } else {
            setError(data.error || 'Failed to fetch contributions');
            setContributions([]);
          }
        })
        .catch(err => {
          setError(err.message || 'An error occurred while fetching contributions');
          setContributions([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (!loading && !userName) {
       setLoading(false);
      if (!error) {
        setError('No GitHub username provided');
      }
    }
  }, [gitName]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner color="primary" />
        <span className="ml-2">Loading projects...</span>
      </div>
    );
  }

  if (error) {
    return <Alert color="danger">{error}</Alert>;
  }

  return (
    <div>
      {showToast && analysisResult && (
        <div className="position-fixed top-0 right-0 p-3" style={{ zIndex: 1050, right: 0, top: 0 }}>
          <Toast isOpen={showToast}>
            <ToastHeader toggle={() => setShowToast(false)}>
              Analysis Results
            </ToastHeader>
            <ToastBody>
              {analysisResult.success ? (
                <div>
                  <p>Successfully analyzed {analysisResult.commits_analyzed} commits!</p>
                  <strong>Skills Updated:</strong>
                  <ul>
                    {Object.entries(analysisResult.analysis).map(([skill, level]) => (
                      <li key={skill}>{skill}: Level {level}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>Analysis failed: {analysisResult.error}</p>
              )}
            </ToastBody>
          </Toast>
        </div>
      )}
      
      <Card className="mt-4">
        <CardBody>
          <CardTitle tag="h3">
            GitHub Projects for {gitName}
          </CardTitle>
          
          {contributions.length === 0 ? (
            <Alert color="info">No contributions found for this user.</Alert>
          ) : (
          <Table striped responsive>
            <thead>
              <tr>
                <th>Repository</th>
                <th>Owner</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((repo, index) => (
                <tr key={index}>
                  <td>{repo.name}</td>
                  <td>{repo.owner}</td>
                  <td>{repo.description || 'No description'}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleAnalyze(repo.owner, repo.name, gitName)}
                    >
                      Analyze
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        </CardBody>
      </Card>
      
      {analyzing && (
        <div className="d-flex justify-content-center mt-3">
          <Spinner color="primary" />
          <span className="ml-2">Analyzing repository contributions...</span>
        </div>
      )}
    </div>
  );
}