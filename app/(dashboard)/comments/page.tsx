'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedule } from '@/lib/context/ScheduleContext';
import { generateId, formatDate } from '@/lib/utils/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CommentsPanel from '@/components/admin/CommentsPanel';

export default function CommentsPage() {
  const { currentUser, isAdmin } = useAuth();
  const { addStudentComment, getGeneralStudentCommentsByAuthor, adminComments } = useSchedule();
  const [message, setMessage] = useState('');

  if (!currentUser) return null;

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Comments Inbox</h1>
          <p className="text-gray-600 mt-2">
            Review private student comments and send replies.
          </p>
        </div>
        <CommentsPanel />
      </div>
    );
  }

  const myMessages = useMemo(
    () =>
      getGeneralStudentCommentsByAuthor(currentUser.id)
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [currentUser.id, getGeneralStudentCommentsByAuthor]
  );

  const handleSubmit = async () => {
    const content = message.trim();
    if (!content) return;

    await addStudentComment({
      id: generateId(),
      commentType: 'general',
      authorId: currentUser.id,
      content,
      createdAt: new Date(),
    });
    setMessage('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Comments to Admin</h1>
        <p className="text-gray-600 mt-2">
          Send private comments directly to admins. Other students cannot see your comments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Comment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your comment for admin..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={!message.trim()}>
              Send to Admin
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Sent Comments</CardTitle>
        </CardHeader>
        <CardContent>
          {myMessages.length > 0 ? (
            <div className="space-y-3">
              {myMessages.map((comment) => (
                <div key={comment.id} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500 mb-1">{formatDate(comment.createdAt.toString())}</p>
                  <p className="text-sm text-gray-800">{comment.content}</p>
                  {adminComments
                    .filter((reply) => reply.targetType === 'student_comment' && reply.targetId === comment.id)
                    .map((reply) => (
                      <div key={reply.id} className="mt-2 rounded border border-gray-200 bg-white p-2">
                        <p className="text-xs text-gray-500 mb-1">
                          Admin reply • {formatDate(reply.createdAt.toString())}
                        </p>
                        <p className="text-sm text-gray-700">{reply.content}</p>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No comments sent yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
