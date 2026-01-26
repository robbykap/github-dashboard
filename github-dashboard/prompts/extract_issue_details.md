Based on this conversation about creating a GitHub issue, extract the current draft information:

{conversation_text}

**Instructions:**
1. Analyze the ENTIRE conversation to understand what issue is being discussed
2. Extract any information the user has provided or the assistant has proposed
3. Be progressive - extract partial information even if not everything is known
4. Infer reasonable values when context is clear (e.g., if user says "the login button is broken", infer issue_type: "bug")
5. For body text, combine all relevant details mentioned so far into a coherent description

Return a JSON object with any available information. Use null for missing fields:
{{
  "title": "Issue title if mentioned or can be inferred, else null",
  "body": "Combine all relevant details discussed into a coherent description, else null",
  "issue_type": "bug|feature|enhancement|documentation|question or null (infer from context)",
  "labels": ["array of suggested labels based on conversation, or empty array"],
  "priority": "low|medium|high|critical or null (infer from severity/urgency mentioned)"
}}

**Examples of contextual inference:**
- User mentions "bug" or describes broken behavior → issue_type: "bug"
- User asks for new capability → issue_type: "feature"
- User describes slow performance → issue_type: "enhancement", priority: "medium"
- User says "urgent" or "critical" → priority: "high" or "critical"
- User mentions specific components → include in labels

Return ONLY valid JSON. Be as complete as possible with the information available.
