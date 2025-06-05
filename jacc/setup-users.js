import { storage } from './server/storage.js';
import { hashPassword } from './server/auth.js';
import crypto from 'crypto';

async function createUsers() {
  try {
    console.log('Creating 3 user accounts...');

    // User 1: Sales Agent
    const salesUser = await storage.createUser({
      id: crypto.randomUUID(),
      username: 'sales_agent',
      email: 'sales@jacc.app',
      passwordHash: await hashPassword('Sales123!'),
      firstName: 'Sales',
      lastName: 'Agent',
      role: 'sales-agent'
    });
    console.log('✓ Created Sales Agent:', salesUser.username);

    // User 2: Client Admin
    const clientAdmin = await storage.createUser({
      id: crypto.randomUUID(),
      username: 'client_admin',
      email: 'admin@jacc.app',
      passwordHash: await hashPassword('Admin123!'),
      firstName: 'Client',
      lastName: 'Administrator',
      role: 'client-admin'
    });
    console.log('✓ Created Client Admin:', clientAdmin.username);

    // User 3: Dev Admin
    const devAdmin = await storage.createUser({
      id: crypto.randomUUID(),
      username: 'dev_admin',
      email: 'dev@jacc.app',
      passwordHash: await hashPassword('Dev123!'),
      firstName: 'Developer',
      lastName: 'Admin',
      role: 'dev-admin'
    });
    console.log('✓ Created Dev Admin:', devAdmin.username);

    console.log('\n=== User Accounts Created ===');
    console.log('1. Sales Agent - Username: sales_agent, Password: Sales123!');
    console.log('2. Client Admin - Username: client_admin, Password: Admin123!');
    console.log('3. Dev Admin - Username: dev_admin, Password: Dev123!');
    console.log('\nLogin at: /api/auth/login');
    console.log('API Documentation: /api/v1/status (requires API key)');

  } catch (error) {
    console.error('Error creating users:', error);
  }
}

createUsers();