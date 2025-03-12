export const fetchGitHubProjects = async (gitHub) => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/github/contributions/${gitHub}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            return data.data; // Return the projects array
        } else {
            throw new Error(data.error || 'Failed to fetch contributions');
        }
    } catch (err) {
        console.error(err.message || 'An error occurred while fetching contributions');
        return []; 
    }
};
