'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Paperclip, Trash2 } from 'lucide-react';
import { useAuth } from './auth-provider';
import {
  attachmentDownloadUrl,
  createComment,
  deleteComment,
  fetchAttachments,
  fetchComments,
  fetchIssue,
  updateComment,
  uploadAttachment,
} from '@/lib/api';
import { Comment } from '@/types/issue';
import { Button, Input } from './ui';
import LoadingState from './loading-state';

interface IssueDetailsModalProps {
  issueId: number | null;
  onClose: () => void;
}

const formatActor = (actor?: { name: string | null; email: string } | null) =>
  actor?.name ?? actor?.email ?? 'Unknown user';

const formatActivity = (type: string, oldValue: string | null, newValue: string | null) => {
  if (oldValue || newValue) {
    return `${type.replaceAll('_', ' ').toLowerCase()}: ${oldValue ?? 'none'} -> ${newValue ?? 'none'}`;
  }
  return type.replaceAll('_', ' ').toLowerCase();
};

export default function IssueDetailsModal({ issueId, onClose }: IssueDetailsModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [editing, setEditing] = useState<Comment | null>(null);

  const issueQuery = useQuery({
    queryKey: ['issue', issueId],
    queryFn: () => fetchIssue(issueId as number),
    enabled: Boolean(issueId),
  });
  const commentsQuery = useQuery({
    queryKey: ['comments', issueId],
    queryFn: () => fetchComments(issueId as number),
    enabled: Boolean(issueId),
  });
  const attachmentsQuery = useQuery({
    queryKey: ['attachments', issueId],
    queryFn: () => fetchAttachments(issueId as number),
    enabled: Boolean(issueId),
  });

  const invalidateDetails = () => {
    if (!issueId) return;
    void queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
    void queryClient.invalidateQueries({ queryKey: ['comments', issueId] });
    void queryClient.invalidateQueries({ queryKey: ['attachments', issueId] });
  };

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => createComment(issueId as number, content),
    onSuccess: () => {
      setNewComment('');
      invalidateDetails();
    },
  });
  const editCommentMutation = useMutation({
    mutationFn: (payload: { id: number; content: string }) =>
      updateComment(issueId as number, payload.id, payload.content),
    onSuccess: () => {
      setEditing(null);
      invalidateDetails();
    },
  });
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => deleteComment(issueId as number, commentId),
    onSuccess: invalidateDetails,
  });
  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAttachment(issueId as number, file),
    onSuccess: invalidateDetails,
  });

  if (!issueId) return null;

  const issue = issueQuery.data;
  const comments = commentsQuery.data ?? issue?.comments ?? [];
  const attachments = attachmentsQuery.data ?? issue?.attachments ?? [];
  const canComment = user?.role === 'ADMIN' || user?.role === 'DEVELOPER';
  const canUpload = canComment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Issue details</p>
            <h3 className="text-2xl font-semibold text-slate-900">{issue?.title ?? 'Loading issue'}</h3>
            {issue ? (
              <p className="mt-2 text-sm text-slate-600">
                Assigned to {formatActor(issue.assignee)} · Created by {formatActor(issue.createdBy)}
              </p>
            ) : null}
          </div>
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        </div>

        {issueQuery.isLoading ? (
          <LoadingState label="Loading details..." />
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="grid gap-4">
              <div className="rounded-lg border border-black/10 p-4">
                <h4 className="font-semibold text-slate-900">Comments</h4>
                {canComment ? (
                  <form
                    className="mt-3 grid gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (newComment.trim()) void addCommentMutation.mutateAsync(newComment.trim());
                    }}
                  >
                    <textarea
                      value={newComment}
                      onChange={(event) => setNewComment(event.target.value)}
                      className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Add a comment"
                    />
                    <Button type="submit" disabled={addCommentMutation.isPending}>Add comment</Button>
                  </form>
                ) : null}

                <div className="mt-4 grid gap-3">
                  {comments.map((comment) => {
                    const canManage =
                      user?.role === 'ADMIN' || comment.authorId === user?.id;
                    const isEditing = editing?.id === comment.id;

                    return (
                      <article key={comment.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{formatActor(comment.author)}</p>
                            <p className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</p>
                          </div>
                          {canManage ? (
                            <div className="flex gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(comment)}>
                                Edit
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => void deleteCommentMutation.mutateAsync(comment.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : null}
                        </div>
                        {isEditing ? (
                          <form
                            className="mt-3 grid gap-2"
                            onSubmit={(event) => {
                              event.preventDefault();
                              if (editing?.content.trim()) {
                                void editCommentMutation.mutateAsync({
                                  id: comment.id,
                                  content: editing.content.trim(),
                                });
                              }
                            }}
                          >
                            <textarea
                              value={editing.content}
                              onChange={(event) => setEditing({ ...editing, content: event.target.value })}
                              className="min-h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            />
                            <div className="flex gap-2">
                              <Button type="submit" size="sm">Save</Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                            </div>
                          </form>
                        ) : (
                          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{comment.content}</p>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>

            <aside className="grid gap-4">
              <div className="rounded-lg border border-black/10 p-4">
                <h4 className="font-semibold text-slate-900">Attachments</h4>
                {canUpload ? (
                  <Input
                    type="file"
                    className="mt-3"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadMutation.mutateAsync(file);
                      event.currentTarget.value = '';
                    }}
                  />
                ) : null}
                <div className="mt-3 grid gap-2">
                  {attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachmentDownloadUrl(issueId, attachment.id)}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Paperclip className="h-4 w-4" />
                      {attachment.fileName}
                    </a>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-black/10 p-4">
                <h4 className="font-semibold text-slate-900">Activity</h4>
                <div className="mt-3 grid gap-3">
                  {(issue?.activityLog ?? []).map((item) => (
                    <div key={item.id} className="border-l-2 border-slate-200 pl-3">
                      <p className="text-sm text-slate-800">
                        {formatActor(item.user)} {formatActivity(item.type, item.oldValue, item.newValue)}
                      </p>
                      <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
