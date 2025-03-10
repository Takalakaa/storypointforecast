import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardTitle, Table, Spinner, Alert } from 'reactstrap';

export default function ProjectView({userName}) {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gitName, setGitName] = useState('');


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
                    <a 
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-primary"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
}