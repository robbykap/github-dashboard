Summarize this GitHub Pull Request in 2-3 sentences:
Title: {title}
Description: {body}

Files Changed ({file_count}):
{files_text}

Return a JSON object with the following structure:
{{
  "summary": "A brief 1-2 sentence description of what this PR does",
  "code_updates": "A short summary of the features/components being changed"
}}

Return ONLY valid JSON, no markdown formatting.
