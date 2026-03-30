'use client';

import { useState } from 'react';
import { useSchedule } from '@/lib/context/ScheduleContext';
import { formatDate } from '@/lib/utils/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PhotoApprovalPanel() {
  const { cleanDuties, approveDuty, rejectDuty } = useSchedule();
  const [expandedDutyId, setExpandedDutyId] = useState<string | null>(null);

  // Filter duties with photos pending approval
  const pendingDuties = cleanDuties.filter(
    (duty) => duty.photoUrl && duty.status === 'pending'
  );

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
            {pendingDuties.map((duty) => (
              <div
                key={duty.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gray-50 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{duty.assignedRoom}</p>
                    <p className="text-sm text-gray-600">
                      Submitted: {duty.submittedAt ? formatDate(duty.submittedAt.toString()) : 'Unknown'}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setExpandedDutyId(
                        expandedDutyId === duty.id ? null : duty.id
                      )
                    }
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {expandedDutyId === duty.id ? '▼' : '▶'}
                  </button>
                </div>

                {/* Details */}
                {expandedDutyId === duty.id && (
                  <div className="p-4 border-t border-gray-200 space-y-4">
                    {/* Photo Preview */}
                    {duty.photoUrl && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Submitted Photo
                        </label>
                        <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={duty.photoUrl}
                            alt="Duty submission"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Assignment Date</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(duty.date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Room/Assignment</p>
                        <p className="font-medium text-gray-900">{duty.assignedRoom}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
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
            ))}
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
