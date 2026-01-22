'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Spinner, Select } from '@/components/ui';
import type { GitHubProjectV2, GitHubProjectV2Field } from '@/types/github';

interface ProjectFieldsFormProps {
  selectedRepo: string;
  onProjectSelect: (projectId: string) => void;
  onFieldChange: (fieldId: string, value: string | number) => void;
  onSubmit: () => void;
  onSkip: () => void;
  isLoading: boolean;
  fieldValues: Record<string, string | number>;
}

export default function ProjectFieldsForm({
  selectedRepo,
  onProjectSelect,
  onFieldChange,
  onSubmit,
  onSkip,
  isLoading,
  fieldValues,
}: ProjectFieldsFormProps) {
  const [projects, setProjects] = useState<GitHubProjectV2[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [projectFields, setProjectFields] = useState<GitHubProjectV2Field[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);

  // Fetch projects when component mounts
  useEffect(() => {
    if (selectedRepo) {
      fetchProjects();
    }
  }, [selectedRepo]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch('/api/github/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: selectedRepo }),
      });
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    setSelectedProject(projectId);
    onProjectSelect(projectId);

    if (!projectId) {
      setProjectFields([]);
      return;
    }

    setLoadingFields(true);
    try {
      const res = await fetch('/api/github/project-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await res.json();
      if (data.success) {
        // Filter out system fields (Title, Status, etc. are usually handled separately)
        const customFields = (data.fields || []).filter(
          (field: GitHubProjectV2Field) =>
            !['Title', 'Assignees', 'Labels', 'Milestone', 'Repository'].includes(field.name)
        );
        setProjectFields(customFields);
      }
    } catch (error) {
      console.error('Failed to fetch project fields:', error);
    } finally {
      setLoadingFields(false);
    }
  };

  const renderFieldInput = (field: GitHubProjectV2Field) => {
    switch (field.dataType) {
      case 'SINGLE_SELECT':
        if (field.options) {
          return (
            <Select
              key={field.id}
              label={field.name}
              value={(fieldValues[field.id] as string) || ''}
              onChange={(e) => onFieldChange(field.id, e.target.value)}
              options={[
                { value: '', label: 'Select...' },
                ...field.options.map((opt) => ({
                  value: opt.id,
                  label: opt.name,
                })),
              ]}
            />
          );
        }
        return null;

      case 'ITERATION':
        if (field.configuration?.iterations) {
          return (
            <Select
              key={field.id}
              label={field.name}
              value={(fieldValues[field.id] as string) || ''}
              onChange={(e) => onFieldChange(field.id, e.target.value)}
              options={[
                { value: '', label: 'Select...' },
                ...field.configuration.iterations.map((iter) => ({
                  value: iter.id,
                  label: iter.title,
                })),
              ]}
            />
          );
        }
        return null;

      case 'TEXT':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gh-text mb-1.5">
              {field.name}
            </label>
            <input
              type="text"
              value={(fieldValues[field.id] as string) || ''}
              onChange={(e) => onFieldChange(field.id, e.target.value)}
              className="w-full px-3 py-2 bg-gh-bg border border-gh-border rounded-md text-gh-text focus:outline-none focus:ring-2 focus:ring-gh-accent"
            />
          </div>
        );

      case 'NUMBER':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gh-text mb-1.5">
              {field.name}
            </label>
            <input
              type="number"
              value={(fieldValues[field.id] as number) || ''}
              onChange={(e) => onFieldChange(field.id, parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gh-bg border border-gh-border rounded-md text-gh-text focus:outline-none focus:ring-2 focus:ring-gh-accent"
            />
          </div>
        );

      case 'DATE':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gh-text mb-1.5">
              {field.name}
            </label>
            <input
              type="date"
              value={(fieldValues[field.id] as string) || ''}
              onChange={(e) => onFieldChange(field.id, e.target.value)}
              className="w-full px-3 py-2 bg-gh-bg border border-gh-border rounded-md text-gh-text focus:outline-none focus:ring-2 focus:ring-gh-accent"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        {loadingProjects ? (
          <div className="flex items-center justify-center py-4">
            <Spinner />
          </div>
        ) : projects.length === 0 ? (
          <p className="text-sm text-gh-text-muted mb-4">
            No projects found for this repository.
          </p>
        ) : (
          <div className="space-y-4">
            <Select
              label="Add to Project"
              value={selectedProject}
              onChange={(e) => handleProjectSelect(e.target.value)}
              options={[
                { value: '', label: 'None (skip project)' },
                ...projects.map((p) => ({
                  value: p.id,
                  label: p.title,
                })),
              ]}
            />

            {loadingFields ? (
              <div className="flex items-center justify-center py-4">
                <Spinner />
              </div>
            ) : selectedProject && projectFields.length > 0 ? (
              <div className="space-y-4 pt-4 border-t border-gh-border">
                <p className="text-sm text-gh-text-muted">Configure project fields:</p>
                {projectFields.map((field) => renderFieldInput(field))}
              </div>
            ) : null}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button onClick={onSubmit} loading={isLoading} className="flex-1">
            Create Issue
          </Button>
          {projects.length > 0 && (
            <Button variant="secondary" onClick={onSkip} disabled={isLoading}>
              Skip Project
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
