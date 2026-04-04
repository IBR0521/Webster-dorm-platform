'use client';

import { CleanDuty } from '@/lib/types';
import { formatDate, getCleanDutyPhotoUrls } from '@/lib/utils/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ExpandableDutyPhoto from '@/components/clean-duty/ExpandableDutyPhoto';

interface DutyCardProps {
  duty: CleanDuty;
  onUploadPhoto: () => void;
}

export default function DutyCard({ duty, onUploadPhoto }: DutyCardProps) {
  const photoUrls = getCleanDutyPhotoUrls(duty);
  const hasPhotos = photoUrls.length > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳ Pending Approval';
      case 'approved':
        return '✅ Approved';
      case 'rejected':
        return '❌ Rejected';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">{duty.assignedRoom}</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {formatDate(duty.date)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                duty.status
              )}`}
            >
              {getStatusLabel(duty.status)}
            </span>
          </div>

          {hasPhotos && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Submitted photos ({photoUrls.length})
              </label>
              <div className="space-y-4">
                {photoUrls.map((url, i) => (
                  <div
                    key={`${duty.id}-photo-${i}`}
                    className="overflow-hidden rounded-lg border border-gray-300 bg-neutral-950 shadow-inner"
                  >
                    <div className="flex justify-center px-2 py-3 sm:px-4 sm:py-4">
                      <ExpandableDutyPhoto
                        src={url}
                        alt={`Duty completion ${i + 1}`}
                        downloadBaseName={`duty-${duty.id}-photo-${i + 1}`}
                        imgClassName="h-auto max-h-[min(88vh,920px)] w-auto max-w-full object-contain"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasPhotos && duty.status === 'pending' && (
            <Button onClick={onUploadPhoto} className="w-full bg-blue-600 hover:bg-blue-700">
              Upload photos
            </Button>
          )}

          {!hasPhotos && duty.status === 'rejected' && (
            <Button onClick={onUploadPhoto} className="w-full bg-orange-600 hover:bg-orange-700">
              Re-upload photos
            </Button>
          )}

          {hasPhotos && duty.status === 'pending' && (
            <div className="text-center py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⏳ Waiting for admin approval
              </p>
            </div>
          )}

          {hasPhotos && duty.status === 'approved' && (
            <div className="text-center py-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">✅ Duty approved</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
