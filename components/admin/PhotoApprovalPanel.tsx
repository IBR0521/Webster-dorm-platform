'use client';

import { useState } from 'react';
import { useSchedule } from '@/lib/context/ScheduleContext';
import { formatDate, getCleanDutyPhotoUrls } from '@/lib/utils/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ExpandableDutyPhoto from '@/components/clean-duty/ExpandableDutyPhoto';

export default function PhotoApprovalPanel() {
  const { cleanDuties, approveDuty, rejectDuty } = useSchedule();
  const [expandedDutyId, setExpandedDutyId] = useState<string | null>(null);

  const pendingDuties = cleanDuties.filter((duty) => {
    const urls = getCleanDutyPhotoUrls(duty);
    return urls.length > 0 && duty.status === 'pending';
  });

  const handleApprove = (dutyId: string) => {
    approveDuty(dutyId);
  };

  const handleReject = (dutyId: string) => {
    rejectDuty(dutyId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo Approval Queue</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingDuties.length > 0 ? (
          <div className="space-y-4">
            {pendingDuties.map((duty) => {
              const photoUrls = getCleanDutyPhotoUrls(duty);
              return (
                <div
                  key={duty.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-50 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{duty.assignedRoom}</p>
                      <p className="text-sm text-gray-600">
                        {photoUrls.length} photo{photoUrls.length === 1 ? '' : 's'} · Submitted:{' '}
                        {duty.submittedAt ? formatDate(duty.submittedAt.toString()) : 'Unknown'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedDutyId(expandedDutyId === duty.id ? null : duty.id)
                      }
                      className="text-gray-600 hover:text-gray-900 shrink-0 ml-2"
                    >
                      {expandedDutyId === duty.id ? '▼' : '▶'}
                    </button>
                  </div>

                  {expandedDutyId === duty.id && (
                    <div className="p-4 border-t border-gray-200 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Submitted photos
                        </label>
                        <div className="space-y-6">
                          {photoUrls.map((url, i) => (
                            <div
                              key={`${duty.id}-admin-${i}`}
                              className="overflow-hidden rounded-xl border border-gray-300 bg-neutral-950 shadow-inner"
                            >
                              <div className="flex justify-center px-2 py-3 sm:px-4 sm:py-5">
                                <ExpandableDutyPhoto
                                  src={url}
                                  alt={`Duty submission ${i + 1}`}
                                  downloadBaseName={`admin-duty-${duty.id}-${i + 1}`}
                                  imgClassName="h-auto max-h-[min(90vh,960px)] w-auto max-w-full object-contain"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Assignment Date</p>
                          <p className="font-medium text-gray-900">
                            {formatDate(duty.date)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Kitchen Task</p>
                          <p className="font-medium text-gray-900">{duty.assignedRoom}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-gray-200">
                        <Button
                          onClick={() => handleApprove(duty.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          ✓ Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(duty.id)}
                          variant="destructive"
                          className="flex-1"
                        >
                          ✗ Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No submissions pending approval</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
