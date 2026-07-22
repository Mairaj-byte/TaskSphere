const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Task = require('./models/Task');
const AuditLog = require('./models/AuditLog');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');

dotenv.config();

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/task_tracker';
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Task.deleteMany({});
    await AuditLog.deleteMany({});
    await Comment.deleteMany({});
    await Notification.deleteMany({});

    console.log('Creating users from .env configuration...');
    const salt = await bcrypt.genSalt(10);

    const adminName = process.env.ADMIN_NAME || 'Sarah Connor';
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@company.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
    const adminPasswordHash = await bcrypt.hash(adminPassword, salt);

    const member1Name = process.env.MEMBER1_NAME || 'John Doe';
    const member1Email = (process.env.MEMBER1_EMAIL || 'member1@company.com').toLowerCase();
    const member1Password = process.env.MEMBER1_PASSWORD || 'password123';
    const member1PasswordHash = await bcrypt.hash(member1Password, salt);

    const member2Name = process.env.MEMBER2_NAME || 'Jane Smith';
    const member2Email = (process.env.MEMBER2_EMAIL || 'member2@company.com').toLowerCase();
    const member2Password = process.env.MEMBER2_PASSWORD || 'password123';
    const member2PasswordHash = await bcrypt.hash(member2Password, salt);

    const admin = new User({
      name: adminName,
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: 'admin',
      active: true
    });

    const member1 = new User({
      name: member1Name,
      email: member1Email,
      passwordHash: member1PasswordHash,
      role: 'member',
      active: true
    });

    const member2 = new User({
      name: member2Name,
      email: member2Email,
      passwordHash: member2PasswordHash,
      role: 'member',
      active: true
    });

    await admin.save();
    await member1.save();
    await member2.save();

    console.log('Users created successfully:');
    console.log(`- Admin: ${adminEmail} (${adminName})`);
    console.log(`- Member 1: ${member1Email} (${member1Name})`);
    console.log(`- Member 2: ${member2Email} (${member2Name})`);

    console.log('Creating sample tasks...');
    const now = new Date();

    const tasksData = [
      {
        title: 'Setup Core Development Environment',
        description: 'Configure Vite, React router, Express server, and initialize git repository.',
        status: 'Approved',
        priority: 'High',
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // due in 2 days
        assignedTo: [member1._id],
        createdBy: admin._id,
        approvedBy: admin._id,
        feedback: ''
      },
      {
        title: 'Implement Database Schemas and Models',
        description: 'Define User, Task, Comment, Notification, and AuditLog schemas in Mongoose. Setup connections.',
        status: 'Completed (Pending Approval)',
        priority: 'Medium',
        dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // due in 1 day
        assignedTo: [member1._id, member2._id],
        createdBy: admin._id,
        approvedBy: null,
        feedback: ''
      },
      {
        title: 'Design Premium Glassmorphism UI Theme',
        description: 'Draft the CSS variable scheme, dark mode configs, cards structure, glassmorphic blurred containers, and responsive grids.',
        status: 'In Progress',
        priority: 'High',
        dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // due in 4 days
        assignedTo: [member2._id],
        createdBy: admin._id,
        approvedBy: null,
        feedback: ''
      },
      {
        title: 'Create Automated Reminder Scheduler',
        description: 'Write node-cron scheduler check function in the backend to scan for upcoming due tasks and notify assigned members.',
        status: 'To Do',
        priority: 'Low',
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // due in 7 days
        assignedTo: [member1._id],
        createdBy: admin._id,
        approvedBy: null,
        feedback: ''
      },
      {
        title: 'Draft Mobile Application Wireframes',
        description: 'Prepare Figma style prototypes and screen drafts for iOS/Android layouts.',
        status: 'Overdue',
        priority: 'High',
        dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // overdue by 3 days
        assignedTo: [member2._id],
        createdBy: admin._id,
        approvedBy: null,
        feedback: ''
      }
    ];

    for (const t of tasksData) {
      const task = new Task(t);
      await task.save();

      // Write creation audit logs
      const log = new AuditLog({
        taskId: task._id,
        userId: admin._id,
        action: 'Created',
        newValue: `Task initialized with status: ${task.status}`
      });
      await log.save();

      // For completed task, simulate member completing it and logging it
      if (task.status === 'Completed (Pending Approval)') {
        await new AuditLog({
          taskId: task._id,
          userId: member1._id,
          action: 'Status Changed',
          oldValue: 'In Progress',
          newValue: 'Completed (Pending Approval)'
        }).save();
      }

      // For approved task, simulate workflow progression
      if (task.status === 'Approved') {
        await new AuditLog({
          taskId: task._id,
          userId: member1._id,
          action: 'Status Changed',
          oldValue: 'In Progress',
          newValue: 'Completed (Pending Approval)'
        }).save();
        await new AuditLog({
          taskId: task._id,
          userId: admin._id,
          action: 'Status Changed',
          oldValue: 'Completed (Pending Approval)',
          newValue: 'Approved'
        }).save();
      }
    }

    console.log('Sample tasks populated successfully!');
    mongoose.connection.close();
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seed();
