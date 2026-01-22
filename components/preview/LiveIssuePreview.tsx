'use client';

import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import type { IssuePreviewData, IssueType, Priority } from '@/types/ai';

interface LiveIssuePreviewProps {
  data: IssuePreviewData | null;
  className?: string;
}

export default function LiveIssuePreview({ data, className = '' }: LiveIssuePreviewProps) {
  if (!data || (!data.title && !data.body)) {
    return (
      <Card className={`opacity-50 ${className}`}>
        <CardHeader>
          <CardTitle>Issue Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gh-text-muted text-sm">
            Start describing your issue to see a preview here...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Issue Preview</CardTitle>
          <div className="flex items-center gap-2">
            {data.issue_type && (
              <Badge variant={getIssueTypeVariant(data.issue_type)}>
                {data.issue_type}
              </Badge>
            )}
            {data.priority && (
              <Badge variant={getPriorityVariant(data.priority)}>
                {data.priority}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.title ? (
          <h4 className="text-gh-text-bright font-semibold mb-3">{data.title}</h4>
        ) : (
          <p className="text-gh-text-muted italic mb-3">No title yet...</p>
        )}

        {data.body ? (
          <div className="text-sm text-gh-text whitespace-pre-wrap bg-gh-bg-tertiary p-3 rounded-md">
            {data.body}
          </div>
        ) : (
          <p className="text-gh-text-muted text-sm italic">No description yet...</p>
        )}

        {data.labels && data.labels.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gh-text-muted">Labels:</span>
            {data.labels.map((label, index) => (
              <Badge key={index} variant="default">
                {label}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getIssueTypeVariant(
  issueType: IssueType
): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'pink' {
  switch (issueType) {
    case 'bug':
      return 'danger';
    case 'feature':
      return 'success';
    case 'enhancement':
      return 'info';
    case 'documentation':
      return 'purple';
    case 'question':
      return 'warning';
    default:
      return 'default';
  }
}

function getPriorityVariant(
  priority: Priority
): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'pink' {
  switch (priority) {
    case 'critical':
      return 'danger';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'default';
    default:
      return 'default';
  }
}
