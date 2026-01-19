const { useState, useEffect } = React;

function useActivitySummaries(items) {
    const [summaries, setSummaries] = useState({});
    const [prFiles, setPrFiles] = useState({});
    const [mentionedUsers, setMentionedUsers] = useState({});
    const [priorities, setPriorities] = useState({});
    const [completedSummaries, setCompletedSummaries] = useState(0);
    const [totalSummaries, setTotalSummaries] = useState(0);

    useEffect(() => {
        if (items.length > 0) {
            setSummaries({});
            setPrFiles({});
            setMentionedUsers({});
            setCompletedSummaries(0);
            setTotalSummaries(items.length);

            for (const item of items) {
                generateSummary(item);
            }
        }
    }, [items]);

    const generateSummary = async (item) => {
        const isPR = !!item.pull_request;
        try {
            const requestBody = {
                id: item.id,
                title: item.title,
                body: item.body || '',
                is_pr: isPR,
                pr_url: isPR ? item.html_url : '',
                repo: item.repository.full_name
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
        summaries,
        prFiles,
        mentionedUsers,
        priorities,
        completedSummaries,
        totalSummaries
    };
}
