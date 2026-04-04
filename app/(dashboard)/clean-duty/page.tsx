'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedule } from '@/lib/context/ScheduleContext';
import { formatDate, isDateToday, generateId, getCleanDutyPhotoUrls } from '@/lib/utils/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PhotoUploadForm from '@/components/clean-duty/PhotoUploadForm';
import DutyCard from '@/components/clean-duty/DutyCard';

export default function CleanDutyPage() {
  const { currentUser } = useAuth();
  const {
    cleanDuties,
    uploadDutyPhotos,
    getUserCleanDuties,
    addStudentComment,
    getStudentCommentsForDutyByAuthor,
  } = useSchedule();
  const [selectedDutyId, setSelectedDutyId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  if (!currentUser) return null;

  const userDuties = getUserCleanDuties(currentUser.id);

  const handlePhotoUpload = (dutyId: string, photoUrls: string[]) => {
    uploadDutyPhotos(dutyId, photoUrls);
    setSelectedDutyId(null);
  };

  const todaysDuty = userDuties.find((duty) => isDateToday(duty.date));

  const handleAddComment = (dutyId: string) => {
    const content = (commentDrafts[dutyId] || '').trim();
    if (!content) return;
    addStudentComment({
      id: generateId(),
      dutyId,
      commentType: 'duty',
      authorId: currentUser.id,
      content,
      createdAt: new Date(),
    });
    setCommentDrafts((prev) => ({ ...prev, [dutyId]: '' }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kitchen Duty Schedule</h1>
        <p className="text-gray-600 mt-2">
          Complete your assigned kitchen cleaning tasks and upload proof of completion.
        </p>
      </div>

      {/* Today's Duty Alert */}
      {todaysDuty && getCleanDutyPhotoUrls(todaysDuty).length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">Today&apos;s Duty</h3>
                <p className="text-yellow-800 mt-1">
                  You have a kitchen cleaning assignment for today. Please complete it and upload photo proof.
                </p>
                <Button
                  className="mt-3"
                  onClick={() => setSelectedDutyId(todaysDuty.id)}
                >
                  Upload photos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Upload Modal */}
      {selectedDutyId && (
        <PhotoUploadForm
          dutyId={selectedDutyId}
          onUpload={handlePhotoUpload}
          onCancel={() => setSelectedDutyId(null)}
        />
      )}

      {/* All Duties */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Duties</h2>
        {userDuties.length > 0 ? (
          <div className="space-y-4">
            {userDuties.map((duty) => (
              <div key={duty.id} className="space-y-2">
                <DutyCard duty={duty} onUploadPhoto={() => setSelectedDutyId(duty.id)} />
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Comment for Admin
                    </label>
                    <textarea
                      value={commentDrafts[duty.id] ?? ''}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({ ...prev, [duty.id]: e.target.value }))
                      }
                      placeholder="Leave a note about this duty for admin..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <Button size="sm" onClick={() => handleAddComment(duty.id)}>
                        Submit Comment
                      </Button>
                      <span className="text-xs text-gray-500">
                        {getStudentCommentsForDutyByAuthor(duty.id, currentUser.id).length > 0
                          ? 'Sent to admin'
                          : 'Not sent yet'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-8">
              <div className="text-center py-8">
                <p className="text-gray-600">No assigned duties at this time</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
