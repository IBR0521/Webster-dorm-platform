'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedule } from '@/lib/context/ScheduleContext';
import { formatDate, generateId, getCleanDutyPhotoUrls } from '@/lib/utils/helpers';
import { AdminComment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ExpandableDutyPhoto from '@/components/clean-duty/ExpandableDutyPhoto';
import { useUserDirectory } from '@/hooks/use-user-directory';

export default function CommentsPanel() {
  const { currentUser } = useAuth();
  const { users } = useUserDirectory();
  const {
    adminComments,
    cleanDuties,
    getStudentCommentsForDuty,
    getGeneralStudentComments,
    addAdminComment,
    deleteAdminComment,
  } = useSchedule();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  if (!currentUser) return null;

  // Get duties with photos (to add comments to)
  const dutiesWithPhotos = cleanDuties.filter(
    (duty) => getCleanDutyPhotoUrls(duty).length > 0
  );

  const handleReply = async (studentCommentId: string) => {
    if (!replyText.trim()) return;

    const newComment: AdminComment = {
      id: generateId(),
      targetId: studentCommentId,
      targetType: 'student_comment',
      authorId: currentUser.id,
      content: replyText,
      createdAt: new Date(),
      visibility: 'admin_only',
    };

    await addAdminComment(newComment);
    setReplyText('');
    setReplyTargetId(null);
  };

  const generalComments = getGeneralStudentComments()
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getAuthorLabel = (authorId: string) => {
    const user = users.find((u) => u.id === authorId);
    if (!user) return 'Unknown student';
    return `${user.name} ${user.surname} (Room ${user.roomNumber})`;
  };

  const getRepliesForStudentComment = (studentCommentId: string) =>
    adminComments
      .filter((comment) => comment.targetType === 'student_comment' && comment.targetId === studentCommentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleRemoveReply = async (replyId: string) => {
    if (!confirm('Remove this admin reply? Students will no longer see it.')) return;
    setRemovingId(replyId);
    try {
      await deleteAdminComment(replyId);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Comments</CardTitle>
      </CardHeader>
      <CardContent>
        {generalComments.length > 0 && (
          <div className="mb-6 space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-4">
            <p className="text-sm font-semibold text-purple-900">General Student Comments</p>
            {generalComments.map((comment) => (
              <div key={comment.id} className="rounded border border-purple-100 bg-white p-3">
                <p className="text-xs text-purple-700 mb-1">
                  {getAuthorLabel(comment.authorId)} • {formatDate(comment.createdAt.toString())}
                </p>
                <p className="text-sm text-gray-800">{comment.content}</p>
                <div className="mt-2 space-y-2">
                  {getRepliesForStudentComment(comment.id).map((reply) => (
                    <div key={reply.id} className="rounded border border-gray-200 bg-gray-50 p-2 text-sm text-gray-700">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-gray-500 mb-1">
                          Admin reply • {formatDate(reply.createdAt.toString())}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={removingId === reply.id}
                          onClick={() => void handleRemoveReply(reply.id)}
                        >
                          {removingId === reply.id ? '…' : 'Remove'}
                        </Button>
                      </div>
                      {reply.content}
                    </div>
                  ))}
                </div>
                {replyTargetId === comment.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      ref={textareaRef}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Reply to this student..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleReply(comment.id)} disabled={!replyText.trim()}>
                        Send Reply
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setReplyTargetId(null); setReplyText(''); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => {
                      setReplyTargetId(comment.id);
                      setTimeout(() => textareaRef.current?.focus(), 0);
                    }}
                  >
                    Reply
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {dutiesWithPhotos.length > 0 ? (
          <div className="space-y-4">
            {dutiesWithPhotos.map((duty) => {
              const urls = getCleanDutyPhotoUrls(duty);
              return (
                <div
                  key={duty.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  {/* Duty Header */}
                  <div>
                    <p className="font-medium text-gray-900">{duty.assignedRoom}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(duty.date)} • Status: {duty.status} • {urls.length} photo
                      {urls.length === 1 ? '' : 's'}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {urls.map((url, i) => (
                      <div
                        key={`${duty.id}-thumb-${i}`}
                        className="overflow-hidden rounded-lg border border-gray-300 bg-neutral-950"
                      >
                        <div className="flex justify-center p-2">
                          <ExpandableDutyPhoto
                            src={url}
                            alt={`${duty.assignedRoom} photo ${i + 1}`}
                            downloadBaseName={`comment-duty-${duty.id}-${i + 1}`}
                            imgClassName="h-auto max-h-56 w-auto max-w-full object-contain"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comments */}
                  {getStudentCommentsForDuty(duty.id).length > 0 && (
                    <div className="space-y-2 bg-blue-50 rounded p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase">Student comments</p>
                      {getStudentCommentsForDuty(duty.id).map((comment) => (
                        <div key={comment.id} className="text-sm">
                          <p className="text-xs text-blue-700 mb-1">
                            {formatDate(comment.createdAt.toString())}
                          </p>
                          <p className="text-blue-900">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {getStudentCommentsForDuty(duty.id).map((studentComment) => (
                    <div key={studentComment.id} className="rounded border border-gray-200 bg-gray-50 p-3 mt-2">
                      <p className="text-xs text-gray-500 mb-1">
                        {getAuthorLabel(studentComment.authorId)} • {formatDate(studentComment.createdAt.toString())}
                      </p>
                      <p className="text-sm text-gray-800">{studentComment.content}</p>
                      <div className="mt-2 space-y-2">
                        {getRepliesForStudentComment(studentComment.id).map((reply) => (
                          <div key={reply.id} className="rounded border border-gray-200 bg-white p-2 text-sm text-gray-700">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs text-gray-500 mb-1">
                                Admin reply • {formatDate(reply.createdAt.toString())}
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={removingId === reply.id}
                                onClick={() => void handleRemoveReply(reply.id)}
                              >
                                {removingId === reply.id ? '…' : 'Remove'}
                              </Button>
                            </div>
                            {reply.content}
                          </div>
                        ))}
                      </div>
                      {replyTargetId === studentComment.id ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            ref={textareaRef}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Reply to this student..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleReply(studentComment.id)} disabled={!replyText.trim()}>
                              Send Reply
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setReplyTargetId(null); setReplyText(''); }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={() => {
                            setReplyTargetId(studentComment.id);
                            setTimeout(() => textareaRef.current?.focus(), 0);
                          }}
                        >
                          Reply
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">
              No submissions available for comments
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
