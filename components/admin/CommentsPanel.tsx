'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedule } from '@/lib/context/ScheduleContext';
import { formatDate, generateId } from '@/lib/utils/helpers';
import { AdminComment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CommentsPanel() {
  const { currentUser } = useAuth();
  const { adminComments, addAdminComment, cleanDuties } = useSchedule();
  const [selectedDutyId, setSelectedDutyId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!currentUser) return null;

  // Get duties with photos (to add comments to)
  const dutiesWithPhotos = cleanDuties.filter((duty) => duty.photoUrl);

  const handleAddComment = (dutyId: string) => {
    if (!commentText.trim()) return;

    const newComment: AdminComment = {
      id: generateId(),
      targetId: dutyId,
      targetType: 'duty',
      authorId: currentUser.id,
      content: commentText,
      createdAt: new Date(),
      visibility: 'admin_only',
    };

    addAdminComment(newComment);
    setCommentText('');
    setSelectedDutyId(null);
  };

  const getDutyComments = (dutyId: string) => {
    return adminComments.filter((comment) => comment.targetId === dutyId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Comments</CardTitle>
      </CardHeader>
      <CardContent>
        {dutiesWithPhotos.length > 0 ? (
          <div className="space-y-4">
            {dutiesWithPhotos.map((duty) => {
              const dutyComments = getDutyComments(duty.id);
              return (
                <div
                  key={duty.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  {/* Duty Header */}
                  <div>
                    <p className="font-medium text-gray-900">{duty.assignedRoom}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(duty.date)} • Status: {duty.status}
                    </p>
                  </div>

                  {/* Comments */}
                  {dutyComments.length > 0 && (
                    <div className="space-y-2 bg-gray-50 rounded p-3">
                      {dutyComments.map((comment) => (
                        <div key={comment.id} className="text-sm">
                          <p className="text-xs text-gray-500 mb-1">
                            Admin • {formatDate(comment.createdAt.toString())}
                          </p>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment Form */}
                  {selectedDutyId === duty.id ? (
                    <div className="space-y-2">
                      <textarea
                        ref={textareaRef}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment about this submission..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddComment(duty.id)}
                          disabled={!commentText.trim()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Post Comment
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDutyId(null);
                            setCommentText('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDutyId(duty.id);
                        setTimeout(() => textareaRef.current?.focus(), 0);
                      }}
                    >
                      Add Comment
                    </Button>
                  )}
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
