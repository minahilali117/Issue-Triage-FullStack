'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Paperclip, Trash2 } from 'lucide-react';
import { useAuth } from './auth-provider';
import {
  ApiError,
  createComment,
  deleteAttachment,
  deleteComment,
  downloadAttachment,
  fetchAttachments,
  fetchComments,
  fetchIssue,
  updateComment,
  uploadAttachment,
} from '@/lib/api';
import { Comment, IssueUser } from '@/types/issue';
import { Button, Input } from './ui';
import LoadingState from './loading-state';
import { appToast } from '@/lib/toast';

interface IssueDetailsModalProps {
  issueId: number | null;
  onClose: () => void;
  users: IssueUser[];
}

const normalizeMentionKey = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const getUserMentionKey = (user: IssueUser) =>
  user.email.split('@')[0].toLowerCase();

const extractMentionIds = (content: string, users: IssueUser[]) => {
  const tokens = new Set(
    Array.from(content.matchAll(/@([a-zA-Z0-9._-]+)/g), (match) => match[1].toLowerCase()),
  );

  if (tokens.size === 0) {
    return [] as number[];
  }

  const ids = new Set<number>();
  for (const user of users) {
    const localPart = getUserMentionKey(user);
    const normalizedName = normalizeMentionKey(user.name ?? '');
    const normalizedEmail = normalizeMentionKey(user.email);
    if (
      tokens.has(localPart) ||
      tokens.has(normalizedName) ||
      tokens.has(normalizedEmail)
    ) {
      ids.add(user.id);
    }
  }

  return Array.from(ids);
};

const getTrailingMentionQuery = (content: string) => {
  const match = content.match(/(?:^|\s)@([a-zA-Z0-9._-]*)$/);
  return match?.[1] ?? '';
};

const allowedAttachmentTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/zip',
]);
const maxAttachmentSize = 10 * 1024 * 1024;
const allowedAttachmentLabel = 'PNG, JPG, WebP, PDF, TXT, or ZIP up to 10 MB';

const formatActor = (actor?: { name: string | null; email: string } | null) =>
  actor?.name ?? actor?.email ?? 'Unknown user';

const formatActivity = (type: string, oldValue: string | null, newValue: string | null) => {
  if (oldValue || newValue) {
    return `${type.replaceAll('_', ' ').toLowerCase()}: ${oldValue ?? 'none'} -> ${newValue ?? 'none'}`;
  }
  return type.replaceAll('_', ' ').toLowerCase();
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError || error instanceof Error ? error.message : fallback;

export default function IssueDetailsModal({
  issueId,
  onClose,
  users,
}: IssueDetailsModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [editing, setEditing] = useState<Comment | null>(null);

  const mentionQuery = useMemo(
    () => getTrailingMentionQuery(newComment),
    [newComment],
  );
  const mentionSuggestions = useMemo(() => {
    if (!mentionQuery) {
      return [] as IssueUser[];
    }

    const needle = mentionQuery.toLowerCase();
    return users
      .filter((candidate) => {
        const localPart = getUserMentionKey(candidate);
        const normalizedName = normalizeMentionKey(candidate.name ?? '');
        const normalizedEmail = normalizeMentionKey(candidate.email);
        return (
          localPart.includes(needle) ||
          normalizedName.includes(needle) ||
          normalizedEmail.includes(needle)
        );
      })
      .slice(0, 5);
  }, [mentionQuery, users]);

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
    mutationFn: (payload: { content: string; mentionIds: number[] }) =>
      createComment(issueId as number, payload),
    onSuccess: () => {
      setNewComment('');
      appToast.commentAdded();
      invalidateDetails();
    },
    onError: (error) => appToast.error(getErrorMessage(error, 'Could not add comment.')),
  });
  const editCommentMutation = useMutation({
    mutationFn: (payload: { id: number; content: string; mentionIds: number[] }) =>
      updateComment(issueId as number, payload.id, {
        content: payload.content,
        mentionIds: payload.mentionIds,
      }),
    onSuccess: () => {
      setEditing(null);
      appToast.commentUpdated();
      invalidateDetails();
    },
    onError: (error) => appToast.error(getErrorMessage(error, 'Could not update comment.')),
  });
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => deleteComment(issueId as number, commentId),
    onSuccess: () => {
      appToast.commentDeleted();
      invalidateDetails();
    },
    onError: (error) => appToast.error(getErrorMessage(error, 'Could not delete comment.')),
  });
  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAttachment(issueId as number, file),
    onSuccess: () => {
      appToast.attachmentUploaded();
      invalidateDetails();
    },
    onError: (error) =>
      appToast.attachmentUploadFailed(
        getErrorMessage(error, `Could not upload attachment. Use ${allowedAttachmentLabel}.`),
      ),
  });
  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: number) =>
      deleteAttachment(issueId as number, attachmentId),
    onSuccess: () => {
      appToast.attachmentDeleted();
      invalidateDetails();
    },
    onError: (error) => appToast.error(getErrorMessage(error, 'Could not delete attachment.')),
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
                      if (newComment.trim()) {
                        addCommentMutation.mutate({
                          content: newComment.trim(),
                          mentionIds: extractMentionIds(newComment, users),
                        });
                      }
                    }}
                  >
                    <textarea
                      value={newComment}
                      onChange={(event) => setNewComment(event.target.value)}
                      maxLength={2000}
                      className="min-h-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Add a comment. Type @aisha to mention someone."
                    />
                    {mentionSuggestions.length > 0 ? (
                      <div className="grid gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
                        <p className="font-medium uppercase tracking-[0.2em] text-slate-500">Mentions</p>
                        <div className="flex flex-wrap gap-2">
                          {mentionSuggestions.map((candidate) => (
                            <button
                              key={candidate.id}
                              type="button"
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:border-slate-300 hover:text-slate-950"
                              onClick={() => {
                                const mentionToken = getUserMentionKey(candidate);
                                setNewComment((current) =>
                                  current.replace(/@([a-zA-Z0-9._-]*)$/, `@${mentionToken} `),
                                );
                              }}
                            >
                              @{getUserMentionKey(candidate)} · {candidate.name ?? candidate.email}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <Button type="submit" disabled={addCommentMutation.isPending}>Add comment</Button>
                  </form>
                ) : null}

                <div className="mt-4 grid gap-3">
                  {comments.map((comment) => {
                    const canEdit = comment.authorId === user?.id;
                    const canDelete =
                      user?.role === 'ADMIN' || comment.authorId === user?.id;
                    const isEditing = editing?.id === comment.id;

                    return (
                      <article key={comment.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{formatActor(comment.author)}</p>
                            <p className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</p>
                          </div>
                          {canEdit || canDelete ? (
                            <div className="flex gap-2">
                              {canEdit ? (
                                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(comment)}>
                                  Edit
                                </Button>
                              ) : null}
                              {canDelete ? (
                                <Button type="button" variant="outline" size="sm" onClick={() => deleteCommentMutation.mutate(comment.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        {isEditing ? (
                          <form
                            className="mt-3 grid gap-2"
                            onSubmit={(event) => {
                              event.preventDefault();
                              if (editing?.content.trim()) {
                                editCommentMutation.mutate({
                                  id: comment.id,
                                  content: editing.content.trim(),
                                  mentionIds: extractMentionIds(editing.content, users),
                                });
                              }
                            }}
                          >
                            <textarea
                              value={editing.content}
                              onChange={(event) => setEditing({ ...editing, content: event.target.value })}
                              maxLength={2000}
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
                  <div className="mt-3 grid gap-2">
                    <Input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.zip,image/png,image/jpeg,image/webp,application/pdf,text/plain,application/zip"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          if (!allowedAttachmentTypes.has(file.type)) {
                            appToast.warning(
                              `Unsupported file type. Please upload ${allowedAttachmentLabel}.`,
                            );
                          } else if (file.size > maxAttachmentSize) {
                            appToast.warning('File is too large. Please upload a file up to 10 MB.');
                          } else {
                            uploadMutation.mutate(file);
                          }
                        }
                        event.currentTarget.value = '';
                      }}
                    />
                    <p className="text-xs text-slate-500">{allowedAttachmentLabel}</p>
                  </div>
                ) : null}
                <div className="mt-3 grid gap-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    >
                      <button
                        type="button"
                        className="flex min-w-0 items-center gap-2 text-left hover:text-slate-950"
                        onClick={() => {
                          downloadAttachment(issueId, attachment.id, attachment.fileName)
                            .then(() => appToast.success('Attachment downloaded.'))
                            .catch((error: unknown) =>
                              appToast.attachmentDownloadFailed(getErrorMessage(error, 'Could not download attachment.')),
                            );
                        }}
                      >
                        <Paperclip className="h-4 w-4 shrink-0" />
                        <span className="truncate">{attachment.fileName}</span>
                      </button>
                      {user?.role === 'ADMIN' || attachment.uploadedBy?.id === user?.id ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
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
