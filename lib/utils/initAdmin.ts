// This file initializes the admin account
// Run this once to create the admin account with the following credentials:
// Email: admin@webster.edu
// Password: admin123

import { User } from '../types';
import { generateId } from './helpers';
import { getUsers, saveUsers } from './storage';
import { isDatabaseEnabled } from '../config/client';

export const initializeAdminAccount = (): void => {
  if (isDatabaseEnabled()) {
    return;
  }

  const users = getUsers();

  // Check if admin already exists
  const adminExists = users.some((u) => u.email === 'admin@webster.edu');

  if (!adminExists) {
    const adminUser: User = {
      id: generateId(),
      name: 'Admin',
      surname: 'Account',
      email: 'admin@webster.edu',
      password: 'admin123',
      phone: '+1-555-0000',
      roomNumber: '999',
      gender: 'male',
      isAdmin: true,
      registeredAt: new Date(),
    };

    users.push(adminUser);
    saveUsers(users);

    console.log('Admin account created successfully');
    console.log('Email: admin@webster.edu');
    console.log('Password: admin123');
  }
};
