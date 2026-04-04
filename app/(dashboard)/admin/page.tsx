'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import PhotoApprovalPanel from '@/components/admin/PhotoApprovalPanel';
import CommentsPanel from '@/components/admin/CommentsPanel';
import { useSchedule } from '@/lib/context/ScheduleContext';
import { getUsers } from '@/lib/utils/storage';
import { getCleanDutyPhotoUrls } from '@/lib/utils/helpers';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, currentUser } = useAuth();
  const {
    cleanDuties,
    assignDutyUsers,
    initializeData,
    studentComments,
  } = useSchedule();
  const [assignMessage, setAssignMessage] = useState('');
  const users = useMemo(() => getUsers().filter((u) => !u.isAdmin), []);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  if (!isAdmin) return null;
  if (!currentUser) return null;

  const pendingSubmissions = cleanDuties.filter(
    (d) => getCleanDutyPhotoUrls(d).length > 0 && d.status === 'pending'
  ).length;

  const usersByRoom = useMemo(() => {
    const roomMap: Record<string, typeof users> = {};
    users.forEach((user) => {
      if (!roomMap[user.roomNumber]) {
        roomMap[user.roomNumber] = [];
      }
      roomMap[user.roomNumber].push(user);
    });
    return Object.entries(roomMap).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [users]);

  const getFloorFromRoom = (roomNumber: string): number | null => {
    if (!roomNumber) return null;
    const normalized = roomNumber.trim();
    const firstDigit = Number(normalized[0]);
    if (Number.isNaN(firstDigit) || firstDigit < 1 || firstDigit > 4) return null;
    return firstDigit;
  };

  const handleAssignRoomToNextDuty = (roomNumber: string) => {
    const roomUsers = users.filter((u) => u.roomNumber === roomNumber);
    if (roomUsers.length === 0) return;
    const floor = getFloorFromRoom(roomNumber);

    if (!floor) {
      setAssignMessage(
        `Room ${roomNumber} has no valid floor (expected room number starting with 1-4).`
      );
      return;
    }

    const nextOpenDuty = cleanDuties
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .find((duty) => (duty.kitchenFloor ?? 1) === floor && duty.assignedUsers.length === 0);

    if (!nextOpenDuty) {
      setAssignMessage(`No open clean duty slots available for floor ${floor} kitchen.`);
      return;
    }

    assignDutyUsers(
      nextOpenDuty.id,
      roomUsers.map((u) => u.id),
      roomNumber
    );
    setAssignMessage(
      `Room ${roomNumber} assigned to floor ${floor} kitchen duty on ${nextOpenDuty.date}.`
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-2">Manage submissions, approvals, and monitor platform activity</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingSubmissions}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-gray-500 mt-1">Registered students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Student Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentComments.length}</div>
              <p className="text-xs text-gray-500 mt-1">Messages from students</p>
            </CardContent>
          </Card>
        </div>

        {/* Scheduling Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduling Controls</CardTitle>
            <CardDescription>Regenerate 30-day schedules and reset slot allocations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={initializeData} variant="outline">
              Regenerate Schedules
            </Button>
          </CardContent>
        </Card>

        {/* Kitchen Duty by Room */}
        <Card>
          <CardHeader>
            <CardTitle>Clean Duty by Room and Floor</CardTitle>
            <CardDescription>
              Each floor has one kitchen. Assign one room to each floor kitchen duty.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersByRoom.length > 0 ? (
              <div className="space-y-4">
                {assignMessage && (
                  <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                    {assignMessage}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {usersByRoom.map(([roomNumber, roomUsers]) => (
                  <div key={roomNumber} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">Room</p>
                      <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">
                        {roomNumber}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Floor: {getFloorFromRoom(roomNumber) ?? 'Unknown'}
                    </p>
                    <div className="space-y-2">
                      {roomUsers.map((user) => (
                        <div key={user.id} className="rounded border border-gray-100 bg-gray-50 p-2">
                          <p className="text-sm font-medium text-gray-900">
                            {user.name} {user.surname}
                          </p>
                          <p className="text-xs text-gray-600">{user.phone}</p>
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleAssignRoomToNextDuty(roomNumber)}
                    >
                      Assign Room to Its Floor Kitchen Duty
                    </Button>
                  </div>
                ))}
              </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No students registered yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Photo Approval Panel */}
        <PhotoApprovalPanel />

        {/* Comments Panel */}
        <CommentsPanel />

        {/* Student Registry */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Surname</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Room</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="py-2 pr-4">{user.name}</td>
                      <td className="py-2 pr-4">{user.surname}</td>
                      <td className="py-2 pr-4">{user.email}</td>
                      <td className="py-2 pr-4">{user.phone}</td>
                      <td className="py-2 pr-4">{user.roomNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
