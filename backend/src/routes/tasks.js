const express = require('express');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/audit');
const { sendInAppNotification, sendAdminNotification } = require('../utils/socket');
const { checkReminders } = require('../utils/reminders');
const Group=require("../models/Group");

const router = express.Router();

router.use(authenticate);

// Helper check for admin or manager privileges
const isManagement = (role) => ['admin', 'manager'].includes(role);

// GET /api/tasks - Search, Filter, Sort tasks
router.get('/', async (req, res) => {
  const { status, priority, dueDate, assignedTo, search, sortBy } = req.query;
  
  const query = {};

  // Role-Based Filtering: Members only see tasks assigned to them
  if (req.user.role === 'member') {
    query.assignedTo = req.user._id;
  } else if (assignedTo) {
    // Admin & Manager can filter by assigned user
    query.assignedTo = assignedTo;
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by priority
  if (priority) {
    query.priority = priority;
  }

  // Filter by dueDate
  const now = new Date();
  if (dueDate === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    query.dueDate = { $gte: startOfToday, $lte: endOfToday };
  } else if (dueDate === 'overdue') {
    query.dueDate = { $lt: now };
    query.status = { $nin: ['Approved', 'Completed (Pending Approval)'] };
  } else if (dueDate === 'upcoming') {
    query.dueDate = { $gt: now };
  }

  // Search in title & description
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Define sorting
  let sortOptions = { createdAt: -1 }; // default
  if (sortBy) {
    const [field, order] = sortBy.split(':');
    sortOptions = { [field]: order === 'desc' ? -1 : 1 };
  }

  try {
    const tasks = await Task.find(query)
      .populate('assignedTo', '_id name email role active')
      .populate('createdBy', '_id name email role')
      .populate('approvedBy', '_id name email role')
      .populate("dependencies", "title status")
      .sort(sortOptions);
      
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/tasks/audit/logs - Retrieve Global Audit Logs (Admin & Manager)
router.get('/audit/logs', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('userId', '_id name role')
      .populate('taskId', '_id title')
      .sort({ createdAt: -1 })
      .limit(15);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/tasks/:id - Task Details
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', '_id name email role active')
      .populate('createdBy', '_id name email role')
      .populate('approvedBy', '_id name email role');
      
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Role check: Members can only view if assigned
    if (req.user.role === 'member' && !task.assignedTo.some(user => user._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'Forbidden. This task is not assigned to you.' });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/tasks - Create Task (Admin only)
router.post('/', requireRole('admin'), async (req, res) => {
 const {
title,
description,
priority,
status,
startDate,
dueDate,
estimatedHours,
assignedTo,
attachments,
tags,
checklist,
dependencies,
isRecurring,
recurringType,
group
} = req.body;
// POST /api/tasks - Create Task (Admin & Manager)
router.post('/', requireRole(['admin', 'manager']), async (req, res) => {
  const { title, description, priority, dueDate, assignedTo, attachments } = req.body;

  try {
    if (!title || !dueDate || !assignedTo || !assignedTo.length) {
      return res.status(400).json({ error: 'Title, due date, and at least one assignee are required.' });
    }

   const task = new Task({
title,
description,

priority,

status,

startDate,

dueDate,

estimatedHours,

assignedTo,

group,

attachments: attachments || [],

tags: tags || [],

checklist: checklist || [],

dependencies: dependencies || [],

isRecurring: isRecurring || false,

recurringType: recurringType || null,

createdBy: req.user._id,

activityLogs: [
{
action: "Task Created",
performedBy: req.user._id
}
]
});

    await task.save();

    // Log action
    await logAction({
      taskId: task._id,
      userId: req.user._id,
      action: 'Created'
    });

    // Notify assigned users
    for (const userId of assignedTo) {
      const notification = new Notification({
        userId,
        message: `You have been assigned to a new task: "${task.title}".`,
        type: 'assignment'
      });
      await notification.save();
      sendInAppNotification(userId, notification);
    }

    const populatedTask = await Task.findById(task._id)
  .populate('assignedTo', '_id name email role active')
  .populate('createdBy', '_id name email role')
  .populate('dependencies', 'title status');

    res.status(201).json(populatedTask);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/tasks/:id - Full Update (Admin & Manager)
router.put('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  const { title, description, priority, dueDate, assignedTo, attachments } = req.body;
  const taskId = req.params.id;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const oldAssigned = task.assignedTo.map(id => id.toString());
    const oldTitle = task.title;
    const oldPriority = task.priority;
    const oldDueDate = task.dueDate.toISOString();

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;
    if (assignedTo && assignedTo.length) task.assignedTo = assignedTo;
    if (attachments) task.attachments = attachments;

    task.activityLogs.push({
    action: "Task Updated",
    performedBy: req.user._id,
    timestamp: new Date()
});
        
     task.activityLogs.push({
  action: "Task Updated",
  performedBy: req.user._id,
  timestamp: new Date()
});

    await task.save();

    // Log changes to AuditLog
    if (oldTitle !== task.title) {
      await logAction({ taskId, userId: req.user._id, action: 'Title Updated', oldValue: oldTitle, newValue: task.title });
    }
    if (oldPriority !== task.priority) {
      await logAction({ taskId, userId: req.user._id, action: 'Priority Updated', oldValue: oldPriority, newValue: task.priority });
    }
    if (dueDate && oldDueDate !== new Date(dueDate).toISOString()) {
      await logAction({ taskId, userId: req.user._id, action: 'Due Date Updated', oldValue: oldDueDate, newValue: new Date(dueDate).toISOString() });
    }

    // Check for newly assigned members to send notifications
    const newAssigned = task.assignedTo.map(id => id.toString());
    const newlyAdded = newAssigned.filter(id => !oldAssigned.includes(id));
    
    if (newlyAdded.length > 0) {
      await logAction({ taskId, userId: req.user._id, action: 'Assignees Updated', newValue: `${newlyAdded.length} new members added` });
      for (const userId of newlyAdded) {
        const notification = new Notification({
          userId,
          message: `You have been assigned to task: "${task.title}".`,
          type: 'assignment'
        });
        await notification.save();
        sendInAppNotification(userId, notification);
      }
    }

    // Notify all assigned users about details update
    for (const userId of task.assignedTo) {
      if (newlyAdded.includes(userId.toString())) continue;
      const notification = new Notification({
        userId,
        message: `Task details updated: "${task.title}".`,
        type: 'update'
      });
      await notification.save();
      sendInAppNotification(userId, notification);
    }

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', '_id name email role active')
      .populate('createdBy', '_id name email role')
      .populate('approvedBy', '_id name email role');

    res.json(populatedTask);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/tasks/:id - Delete Task (Admin & Manager)
router.delete('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Notify assigned users of deletion
    for (const userId of task.assignedTo) {
      const notification = new Notification({
        userId,
        message: `Task "${task.title}" has been deleted.`,
        type: 'update'
      });
      await notification.save();
      sendInAppNotification(userId, notification);
    }

    // Clean up associated comments and audit logs
    await Comment.deleteMany({ taskId: req.params.id });
    await AuditLog.deleteMany({ taskId: req.params.id });

    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/tasks/:id/status - Status Transition Workflows (Admins, Managers & Assignees)
router.patch('/:id/status', async (req, res) => {
  const { status, feedback } = req.body;
  const taskId = req.params.id;

  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    // ================= Dependency Validation =================

if (
  status === "In Progress" &&
  task.dependencies &&
  task.dependencies.length > 0
) {

  const dependencyTasks = await Task.find({
    _id: { $in: task.dependencies }
  });

  const incomplete = dependencyTasks.filter(
    t => t.status !== "Approved"
  );

  if (incomplete.length > 0) {
    return res.status(400).json({
      error:
        "Complete all dependency tasks before starting this task."
    });
  }

}

    const oldStatus = task.status;
    const isAssignee = task.assignedTo.some(userId => userId.toString() === req.user._id.toString());
    const hasMgmtPrivilege = isManagement(req.user.role);

    if (!hasMgmtPrivilege && !isAssignee) {
      return res.status(403).json({ error: 'Forbidden. You are not authorized to update this task status.' });
    }

    // Validate workflow state machine:
    if (status === 'Approved' || status === 'Rejected') {
      // Admins and Managers can approve or reject
      if (!hasMgmtPrivilege) {
        return res.status(403).json({ error: 'Forbidden. Only managers and administrators can approve or reject tasks.' });
      }
      if (status === 'Rejected' && (!feedback || !feedback.trim())) {
        return res.status(400).json({ error: 'Feedback is required when rejecting a task.' });
      }
    }

    if (status === 'Completed (Pending Approval)' && !isAssignee && !hasMgmtPrivilege) {
      return res.status(403).json({ error: 'Forbidden. Only assigned members should submit for approval.' });
    }

    // Update status
    task.status = status;

    task.activityLogs.push({
    action: `Status changed to ${status}`,
    performedBy: req.user._id,
    timestamp: new Date()
});

    if (status === 'Approved') {
      task.approvedBy = req.user._id;
      task.activityLogs.push({
    action: "Task Approved",
    performedBy: req.user._id,
    timestamp: new Date()
});
      task.feedback = '';
    } else if (status === 'Rejected') {
      task.approvedBy = null;
      task.feedback = feedback;
      task.activityLogs.push({
    action: "Task Rejected",
    performedBy: req.user._id,
    timestamp: new Date()
});
    } else {
      task.approvedBy = null;
      task.feedback = '';
    }

    await task.save();

    // Log to Audit Log
    await logAction({
      taskId,
      userId: req.user._id,
      action: 'Status Changed',
      oldValue: oldStatus,
      newValue: status
    });

    if (status === 'Rejected' && feedback) {
      await logAction({
        taskId,
        userId: req.user._id,
        action: 'Feedback Added',
        newValue: feedback
      });
    }

    // Handle Notifications:
    if (status === 'Completed (Pending Approval)') {
<<<<<<< HEAD

      task.activityLogs.push({
    action: "Submitted for Approval",
    performedBy: req.user._id,
    timestamp: new Date()
});
      // Notify all admins
      const admins = await User.find({ role: 'admin', active: true });
      for (const admin of admins) {
=======
      // Notify all management roles (Admins and Managers)
      const mgmtUsers = await User.find({ role: { $in: ['admin', 'manager'] }, active: true });
      for (const user of mgmtUsers) {
>>>>>>> a4aee9d0cbfe0ad0cfdd88b119a89958d6961992
        const notification = new Notification({
          userId: user._id,
          message: `${req.user.name} has submitted task "${task.title}" for approval.`,
          type: 'completed'
        });
        await notification.save();
        sendInAppNotification(user._id, notification);
      }
    } else if (status === 'Approved') {
      // Notify all assigned users
      for (const userId of task.assignedTo) {
        const notification = new Notification({
          userId,
          message: `Your task "${task.title}" has been approved!`,
          type: 'approval'
        });
        await notification.save();
        sendInAppNotification(userId, notification);
      }
    } else if (status === 'Rejected') {
      // Notify all assigned users
      for (const userId of task.assignedTo) {
        const notification = new Notification({
          userId,
          message: `Your task "${task.title}" has been rejected. Feedback: "${feedback}"`,
          type: 'rejection'
        });
        await notification.save();
        sendInAppNotification(userId, notification);
      }
    }

    const populatedTask = await Task.findById(taskId)
      .populate('assignedTo', '_id name email role active')
      .populate('createdBy', '_id name email role')
      .populate('approvedBy', '_id name email role')
.populate('dependencies', 'title status');

    res.json(populatedTask);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/tasks/:id/comments - Retrieve Task Comments
router.get('/:id/comments', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check visibility permissions
    if (req.user.role === 'member' && !task.assignedTo.includes(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden. You do not have access to this task.' });
    }

    const comments = await Comment.find({ taskId: req.params.id })
      .populate('userId', '_id name email role')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/tasks/:id/comments - Create Comment
router.post('/:id/comments', async (req, res) => {
  const { message } = req.body;
  const taskId = req.params.id;

  try {
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Comment message cannot be empty.' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check visibility permissions
    const isAssignee = task.assignedTo.some(userId => userId.toString() === req.user._id.toString());
    const hasMgmtPrivilege = isManagement(req.user.role);

    if (!hasMgmtPrivilege && !isAssignee) {
      return res.status(403).json({ error: 'Forbidden. You do not have access to this task.' });
    }

    const comment = new Comment({
      taskId,
      userId: req.user._id,
      message: message.trim()
    });

    await comment.save();

    // Log comment in history
    await logAction({
      taskId,
      userId: req.user._id,
      action: 'Comment Added'
    });

    // Notify other users:
    if (hasMgmtPrivilege) {
      for (const userId of task.assignedTo) {
        if (userId.toString() === req.user._id.toString()) continue;
        const notification = new Notification({
          userId,
          message: `${req.user.name} (${req.user.role}) commented on task "${task.title}".`,
          type: 'update'
        });
        await notification.save();
        sendInAppNotification(userId, notification);
      }
    } else {
      // If Member comments, notify creator and other assigned members
      const notifyList = new Set();
      if (task.createdBy) notifyList.add(task.createdBy.toString());
      task.assignedTo.forEach(id => notifyList.add(id.toString()));
      notifyList.delete(req.user._id.toString());

      for (const userId of notifyList) {
        const notification = new Notification({
          userId,
          message: `${req.user.name} commented on task "${task.title}".`,
          type: 'update'
        });
        await notification.save();
        sendInAppNotification(userId, notification);
      }
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', '_id name email role');

    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/tasks/:id/history - Retrieve Task Audit Log
router.get('/:id/history', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check visibility permissions
    if (req.user.role === 'member' && !task.assignedTo.includes(req.user._id)) {
      return res.status(403).json({ error: 'Forbidden. You do not have access to this task.' });
    }

    const logs = await AuditLog.find({ taskId: req.params.id })
      .populate('userId', '_id name email role')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/tasks/test-cron - Dev endpoint to trigger manual reminder checking
router.post('/test-cron', async (req, res) => {
  try {
    await checkReminders();
    res.json({ message: 'Overdue checking and upcoming reminders processed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to trigger cron action: ' + err.message });
  }
});

module.exports = router;