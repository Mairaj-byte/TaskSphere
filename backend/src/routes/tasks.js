const express = require('express');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/audit');
const { sendInAppNotification } = require('../utils/socket');
const { checkReminders } = require('../utils/reminders');
const Group = require("../models/Group");

const router = express.Router();

router.use(authenticate);

const isManagement = (role) => ['admin', 'manager'].includes(role);

// GET /api/tasks
router.get('/', async (req, res) => {
  const { status, priority, dueDate, assignedTo, search, sortBy } = req.query;
  const query = {};

  if (req.user.role === 'member') {
    query.assignedTo = req.user._id;
  } else if (assignedTo) {
    query.assignedTo = assignedTo;
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;

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

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  let sortOptions = { createdAt: -1 };
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

// GET /api/tasks/audit/logs
router.get('/audit/logs', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const logs = await AuditLog.find().populate('userId', '_id name role').populate('taskId', '_id title').sort({ createdAt: -1 }).limit(15);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', '_id name email role active')
      .populate('createdBy', '_id name email role')
      .populate('approvedBy', '_id name email role');
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    if (req.user.role === 'member' && !task.assignedTo.some(user => user._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'Forbidden. This task is not assigned to you.' });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/tasks - Create Task
router.post('/', requireRole(['admin', 'manager']), async (req, res) => {
  const { title, description, priority, status, startDate, dueDate, estimatedHours, assignedTo, attachments, tags, checklist, dependencies, isRecurring, recurringType, group } = req.body;

  try {
    if (!title || !dueDate || !assignedTo || !assignedTo.length) {
      return res.status(400).json({ error: 'Title, due date, and at least one assignee are required.' });
    }

    const task = new Task({
      title, description, priority, status, startDate, dueDate, estimatedHours, assignedTo, group,
      attachments: attachments || [],
      tags: tags || [],
      checklist: checklist || [],
      dependencies: dependencies || [],
      isRecurring: isRecurring || false,
      recurringType: recurringType || null,
      createdBy: req.user._id,
      activityLogs: [{ action: "Task Created", performedBy: req.user._id }]
    });

    await task.save();
    await logAction({ taskId: task._id, userId: req.user._id, action: 'Created' });

    for (const userId of assignedTo) {
      const notification = new Notification({ userId, message: `You have been assigned to a new task: "${task.title}".`, type: 'assignment' });
      await notification.save();

      sendInAppNotification(userId, notification);

      sendTaskUpdate(userId, task._id);

      const user = await User.findById(userId);

      if (user?.email) {
        await sendEmail(
          user.email,
          "New Task Assigned - TaskSphere",
          `
            <h2>Hello ${user.name},</h2>
            <p>You have been assigned a new task.</p>

            <p><strong>Task:</strong> ${task.title}</p>
            <p><strong>Priority:</strong> ${task.priority}</p>
            <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleString()}</p>

            <br/>
            <p>Please login to TaskSphere to view the task.</p>
          `
        );
      }
    }

    const populatedTask = await Task.findById(task._id).populate('assignedTo', '_id name email role active').populate('createdBy', '_id name email role').populate('dependencies', 'title status');
    res.status(201).json(populatedTask);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  const { title, description, priority, dueDate, assignedTo, attachments } = req.body;
  const taskId = req.params.id;

  try {
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

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

    task.activityLogs.push({ action: "Task Updated", performedBy: req.user._id, timestamp: new Date() });

    await task.save();

    if (oldTitle !== task.title) await logAction({ taskId, userId: req.user._id, action: 'Title Updated', oldValue: oldTitle, newValue: task.title });
    if (oldPriority !== task.priority) await logAction({ taskId, userId: req.user._id, action: 'Priority Updated', oldValue: oldPriority, newValue: task.priority });
    if (dueDate && oldDueDate !== new Date(dueDate).toISOString()) await logAction({ taskId, userId: req.user._id, action: 'Due Date Updated', oldValue: oldDueDate, newValue: new Date(dueDate).toISOString() });

    const newAssigned = task.assignedTo.map(id => id.toString());
    const newlyAdded = newAssigned.filter(id => !oldAssigned.includes(id));

    if (newlyAdded.length > 0) {
      await logAction({
        taskId,
        userId: req.user._id,
        action: 'Assignees Updated',
        newValue: `${newlyAdded.length} new members added`
      });
      for (const userId of newlyAdded) {
        const notification = new Notification({ userId, message: `You have been assigned to task: "${task.title}".`, type: 'assignment' });
        await notification.save();
        sendInAppNotification(userId, notification);
        sendTaskUpdate(userId, task._id);

        const user = await User.findById(userId);

        if (user?.email) {
          await sendEmail(
            user.email,
            "🎉 Task Approved - TaskSphere",
            `
              <div style="font-family: Arial, sans-serif; line-height:1.6;">
                <h2 style="color:#16a34a;">🎉 Congratulations, ${user.name}!</h2>

                <p>Your task has been <strong>approved</strong> by the administrator.</p>

                <table style="border-collapse: collapse;">
                  <tr>
                    <td><strong>Task:</strong></td>
                    <td>${task.title}</td>
                  </tr>
                  <tr>
                    <td><strong>Status:</strong></td>
                    <td style="color:green;"><b>Approved ✅</b></td>
                  </tr>
                  <tr>
                    <td><strong>Approved By:</strong></td>
                    <td>${req.user.name}</td>
                  </tr>
                </table>

                <br>

                <p>Great work! Keep up the excellent performance.</p>

                <hr>

                <p>
                  Regards,<br>
                  <strong>TaskSphere Team</strong>
                </p>
              </div>
            `
          );
        }
      }
    }

    const populatedTask = await Task.findById(task._id).populate('assignedTo', '_id name email role active').populate('createdBy', '_id name email role').populate('approvedBy', '_id name email role');
    res.json(populatedTask);
  } catch (err) {
    console.error("PATCH /tasks/:id/status ERROR:", err);
    res.status(500).json({
      error: err.message,
      stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    });
  }
});

// ... (Remainder of routes remain the same)
module.exports = router;
