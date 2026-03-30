'use client';

import { CleanDuty } from '@/lib/types';
import { formatDate } from '@/lib/utils/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DutyCardProps {
  duty: CleanDuty;
  photoUrl?: string;
  onUploadPhoto: () => void;
}

export default function DutyCard({
  duty,
  photoUrl,
  onUploadPhoto,
}: DutyCardProps) {
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
          {/* Duty Info */}
          <div>
            <p className="text-sm text-gray-600">{duty.assignedRoom}</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {formatDate(duty.date)}
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                duty.status
              )}`}
            >
              {getStatusLabel(duty.status)}
            </span>
          </div>

          {/* Photo Preview */}
          {photoUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Submitted Photo</label>
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={photoUrl}
                  alt="Duty completion"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          {!photoUrl && duty.status === 'pending' && (
            <Button
              onClick={onUploadPhoto}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Upload Photo
            </Button>
          )}

          {!photoUrl && duty.status === 'rejected' && (
            <Button
              onClick={onUploadPhoto}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              Re-upload Photo
            </Button>
          )}

          {photoUrl && duty.status === 'pending' && (
            <div className="text-center py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⏳ Waiting for admin approval
              </p>
            </div>
          )}

          {photoUrl && duty.status === 'approved' && (
            <div className="text-center py-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Duty approved
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
