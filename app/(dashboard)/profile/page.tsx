'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils/helpers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { currentUser, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    roomNumber: '',
    gender: 'male' as 'male' | 'female',
  });

  if (!currentUser) return null;

  useEffect(() => {
    setFormData({
      name: currentUser.name,
      surname: currentUser.surname,
      phone: currentUser.phone,
      roomNumber: currentUser.roomNumber,
      gender: currentUser.gender,
    });
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage('');
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.surname.trim() || !formData.phone.trim()) {
      setMessage('Please fill in all editable fields.');
      return;
    }

    if (!currentUser.isAdmin && !formData.roomNumber.trim()) {
      setMessage('Please fill in all editable fields.');
      return;
    }

    setIsSaving(true);
    const success = await updateProfile({
      name: formData.name.trim(),
      surname: formData.surname.trim(),
      phone: formData.phone.trim(),
      roomNumber: currentUser.isAdmin ? currentUser.roomNumber : formData.roomNumber.trim(),
      gender: formData.gender,
    });
    setIsSaving(false);

    if (success) {
      setIsEditing(false);
      setMessage('Profile updated successfully.');
    } else {
      setMessage('Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: currentUser.name,
      surname: currentUser.surname,
      phone: currentUser.phone,
      roomNumber: currentUser.roomNumber,
      gender: currentUser.gender,
    });
    setMessage('');
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Your account information and preferences</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Account Information</CardTitle>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              {isEditing ? (
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              ) : (
                <p className="text-lg text-gray-900 font-medium">{currentUser.name}</p>
              )}
            </div>

            {/* Surname */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Surname
              </label>
              {isEditing ? (
                <Input
                  name="surname"
                  value={formData.surname}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              ) : (
                <p className="text-lg text-gray-900">{currentUser.surname}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <p className="text-lg text-gray-900">{currentUser.email}</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              {isEditing ? (
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              ) : (
                <p className="text-lg text-gray-900">{currentUser.phone}</p>
              )}
            </div>

            {!currentUser.isAdmin && (
              <>
                {/* Room */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Number
                  </label>
                  {isEditing ? (
                    <Input
                      name="roomNumber"
                      value={formData.roomNumber}
                      onChange={handleChange}
                      disabled={isSaving}
                    />
                  ) : (
                    <p className="text-lg text-gray-900">{currentUser.roomNumber}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={isSaving}
                      className="w-full md:w-60 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  ) : (
                    <p className="text-lg text-gray-900 capitalize">
                      {currentUser.gender}
                    </p>
                  )}
                </div>
              </>
            )}

            {currentUser.isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dorm Information
                </label>
                <p className="text-lg text-gray-900">Not applicable for admin accounts</p>
              </div>
            )}

            {/* Registered Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registered On
              </label>
              <p className="text-lg text-gray-900">
                {formatDate(currentUser.registeredAt.toString())}
              </p>
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Type
              </label>
              <div className="flex items-center gap-2">
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {currentUser.isAdmin ? 'Admin' : 'Student'}
                </span>
              </div>
            </div>

            {message && (
              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                {message}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            {currentUser.isAdmin
              ? 'Admin profiles are non-resident accounts. Dorm-specific fields are hidden.'
              : 'You can edit your personal details above. Email and account type remain fixed for account integrity.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
