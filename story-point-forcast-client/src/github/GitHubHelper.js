export const fetchGitHubProjects = async (gitHub) => {
    if (!gitHub) return [];

    let page = 1;
    let contributedProjects = new Set();
    let moreData = true;

    // Fetch all events -- limit 90 days i think
    while (moreData) {
        try {
            const response = await fetch(`https://api.github.com/users/${gitHub}/events?page=${page}`);
            if (response.status === 304) break;

            const events = await response.json();
            if (!Array.isArray(events) || events.length === 0) {
                moreData = false;
                break;
            }

            events.forEach(event => {
                if (event.type === "PushEvent") {
                    contributedProjects.add(event.repo.name);
                }
            });

            page++;
        } catch (error) {
            console.error("Error fetching GitHub events:", error);
            break;
        }
    }

    // Fetch public repositories
    try {
        const publicReposResponse = await fetch(`https://api.github.com/users/${gitHub}/repos`);
        const publicRepos = await publicReposResponse.json();

        publicRepos.forEach(repo => contributedProjects.add(repo.full_name));
    } catch (error) {
        console.error("Error fetching public repos:", error);
    }

    return Array.from(contributedProjects).map(name => ({ name }));
};
