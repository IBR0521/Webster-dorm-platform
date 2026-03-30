'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useSchedule } from '@/lib/context/ScheduleContext';
import { formatDate, isDateToday } from '@/lib/utils/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PhotoUploadForm from '@/components/clean-duty/PhotoUploadForm';
import DutyCard from '@/components/clean-duty/DutyCard';

export default function CleanDutyPage() {
  const { currentUser } = useAuth();
  const { cleanDuties, uploadDutyPhoto, getUserCleanDuties } = useSchedule();
  const [selectedDutyId, setSelectedDutyId] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, string>>({});

  if (!currentUser) return null;

  const userDuties = getUserCleanDuties(currentUser.id);

  const handlePhotoUpload = (dutyId: string, photoUrl: string) => {
    uploadDutyPhoto(dutyId, photoUrl);
    setUploadedPhotos((prev) => ({ ...prev, [dutyId]: photoUrl }));
    setSelectedDutyId(null);
  };

  const todaysDuty = userDuties.find((duty) => isDateToday(duty.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clean Duty Schedule</h1>
        <p className="text-gray-600 mt-2">
          Complete your assigned clean duties and upload proof of completion.
        </p>
      </div>

      {/* Today's Duty Alert */}
      {todaysDuty && !todaysDuty.photoUrl && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900">Today&apos;s Duty</h3>
                <p className="text-yellow-800 mt-1">
                  You have a clean duty assignment for today. Please complete it and upload a photo.
                </p>
                <Button
                  className="mt-3"
                  onClick={() => setSelectedDutyId(todaysDuty.id)}
                >
                  Upload Photo
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
              <DutyCard
                key={duty.id}
                duty={duty}
                photoUrl={uploadedPhotos[duty.id]}
                onUploadPhoto={() => setSelectedDutyId(duty.id)}
              />
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
