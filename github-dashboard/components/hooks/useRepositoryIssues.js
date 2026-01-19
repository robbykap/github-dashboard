const { useState, useEffect } = React;

function useRepositoryIssues(repo, token) {
    const [issues, setIssues] = useState([]);
    const [prs, setPrs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [summaries, setSummaries] = useState({});
    const [prFiles, setPrFiles] = useState({});
    const [mentionedUsers, setMentionedUsers] = useState({});
    const [priorities, setPriorities] = useState({});
    const [totalSummaries, setTotalSummaries] = useState(0);
    const [completedSummaries, setCompletedSummaries] = useState(0);

    useEffect(() => {
        if (repo) {
            fetchData();
        } else {
            setIssues([]);
            setPrs([]);
            setSummaries({});
            setPriorities({});
        }
    }, [repo]);

    const fetchData = async () => {
        setLoading(true);
        setSummaries({});
        setPriorities({});
        setCompletedSummaries(0);
        setTotalSummaries(0);
        try {
            const res = await fetch(
                `https://api.github.com/repos/${repo.full_name}/issues?state=open&per_page=30`,
                { headers: { 'Authorization': `token ${token}` } }
            );
            if (res.ok) {
                const data = await res.json();
                const issueList = data.filter(item => !item.pull_request);
                const prList = data.filter(item => item.pull_request);

                if (issueList.length > 0) {
                    const priorityOrder = await getPriorities(issueList);
                    const priorityMap = {};
                    priorityOrder.forEach((id, index) => {
                        priorityMap[id] = index + 1;
                    });
                    setPriorities(priorityMap);

                    issueList.sort((a, b) => {
                        const pa = priorityMap[a.id] || 999;
                        const pb = priorityMap[b.id] || 999;
                        return pa - pb;
                    });
                }

                setIssues(issueList);
                setPrs(prList);

                const allItems = [...issueList, ...prList];
                setTotalSummaries(allItems.length);

                for (const item of allItems) {
                    generateSummary(item);
                }
            }
        } catch (err) {
            console.error('Failed to fetch:', err);
        }
        setLoading(false);
    };

    const getPriorities = async (issueList) => {
        try {
            const res = await fetch('/api/prioritize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    issues: issueList.map(i => ({ id: i.id, title: i.title }))
                })
            });
            const data = await res.json();
            return data.priorities || [];
        } catch (err) {
            return issueList.map(i => i.id);
        }
    };

    const generateSummary = async (item) => {
        const isPR = !!item.pull_request;
        try {
            const requestBody = {
                id: item.id,
                title: item.title,
                body: item.body || '',
                is_pr: isPR,
                pr_url: isPR ? item.html_url : '',
                repo: repo.full_name
            };

            const res = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            const data = await res.json();
            setSummaries(prev => ({ ...prev, [item.id]: data.summary }));

            if (isPR && data.files) {
                setPrFiles(prev => ({ ...prev, [item.id]: data.files }));
            }

            if (!isPR && data.mentioned_users) {
                setMentionedUsers(prev => ({ ...prev, [item.id]: data.mentioned_users }));
            }

            setCompletedSummaries(prev => prev + 1);
        } catch (err) {
            const errorSummary = isPR
                ? { summary: 'Summary unavailable', code_updates: '' }
                : { issue_type: 'unknown', summary: 'Summary unavailable' };
            setSummaries(prev => ({ ...prev, [item.id]: errorSummary }));
            setCompletedSummaries(prev => prev + 1);
        }
    };

    return {
        issues,
        prs,
        loading,
        summaries,
        prFiles,
        mentionedUsers,
        priorities,
        totalSummaries,
        completedSummaries
    };
}
