const express = require('express');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');
const { logAction } = require('../utils/audit');
const { sendInAppNotification, sendTaskUpdate } = require('../utils/socket');
const { checkReminders } = require('../utils/reminders');
const Group=require("../models/Group");
const { parseVoiceTranscript } = require('../utils/voiceParser');
const { upsertTaskEvent, deleteTaskEvent } = require('../utils/googleCalendar');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

router.use(authenticate);

const isManagement = (role) => ['admin', 'manager'].includes(role);

// GET /api/tasks
// POST /api/tasks/parse-voice - Voice-to-task: parse a transcript into task fields
// (does NOT create the task — returns suggestions for the admin/manager to review
// and confirm in the normal create-task form)
router.post('/parse-voice', requireRole(['admin', 'manager']), async (req, res) => {
  const { transcript } = req.body;

  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: 'Transcript is required.' });
  }

  try {
    const users = await User.find({ active: true }, '_id name');
    const parsed = parseVoiceTranscript(transcript, users);

    res.json({
      title: parsed.title,
      priority: parsed.priority,
      dueDate: parsed.dueDate,
      assignedTo: parsed.assignees.map((a) => a._id),
      assignedToNames: parsed.assignees.map((a) => a.name),
      warnings: parsed.warnings,
    });
  } catch (err) {

  console.error("POST /api/tasks ERROR:", err);

  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV !== "production"
      ? err.stack
      : undefined,
  });

}
});

// GET /api/tasks - Search, Filter, Sort tasks
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
  console.error("GET /api/tasks ERROR:", err);

  res.status(500).json({
    error: err.message,
  });
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

// POST /api/tasks - Create Task (Admin & Manager)
router.post('/', requireRole(['admin', 'manager']), async (req, res) => {
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

    const calendarEvents = [];
    await task.save();
    // checkReminders();
    await logAction({ taskId: task._id, userId: req.user._id, action: 'Created' });

    await checkReminders();
    console.log("✅ Reminder check triggered after task creation");

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

      // Google Calendar sync (spec section 15) — best-effort only. If the
      // user hasn't connected their calendar, or the API call fails for
      // any reason, this must never block task creation itself.
      try {
        if (user) {
          const eventId = await upsertTaskEvent(user, task, null);
          if (eventId) calendarEvents.push({ user: userId, eventId });
        }
      } catch (calendarErr) {
        console.error('Calendar sync failed on task create:', calendarErr.message);
      }
    }

    if (calendarEvents.length) {
      task.googleCalendarEvents = calendarEvents;
      await task.save();
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
    task.activityLogs.push({
    action: "Task Updated",
    performedBy: req.user._id,
    timestamp: new Date()
});

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
             // Google Calendar sync for newly-added assignees — best-effort,
        // never blocks the response.
        try {
          if (user) {
            const eventId = await upsertTaskEvent(user, task, null);
            if (eventId) {
              task.googleCalendarEvents.push({ user: userId, eventId });
            }
          }
        } catch (calendarErr) {
          console.error('Calendar sync failed on assignee add:', calendarErr.message);
        }
      }
    }

    // Google Calendar sync for assignees who were already on the task —
    // if the title or due date changed, push that update to their
    // existing event. Best-effort, never blocks the response.
    if (title || dueDate) {
      const stillAssigned = newAssigned.filter((id) => oldAssigned.includes(id));
      for (const userIdStr of stillAssigned) {
        const existing = task.googleCalendarEvents.find((e) => e.user.toString() === userIdStr);
        if (!existing) continue;
        try {
          const user = await User.findById(userIdStr);
          if (user) await upsertTaskEvent(user, task, existing.eventId);
        } catch (calendarErr) {
          console.error('Calendar sync failed on task update:', calendarErr.message);
        }
      }
    }

    await task.save();

    const populatedTask = await Task.findById(task._id).populate('assignedTo', '_id name email role active').populate('createdBy', '_id name email role').populate('approvedBy', '_id name email role');
    res.json(populatedTask);
  } catch (err) {
    console.error("PATCH /tasks/:id/status ERROR:", err);
    res.status(500).json({
      error: err.message,
      stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    });
  }
})

// ... (Remainder of routes remain the same)
// DELETE /api/tasks/:id - Delete Task (Admin & Manager)
router.delete('/:id', requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Clean up any Google Calendar events created for this task —
    // best-effort, never blocks the delete response.
    for (const entry of task.googleCalendarEvents || []) {
      try {
        const user = await User.findById(entry.user);
        if (user) await deleteTaskEvent(user, entry.eventId);
      } catch (calendarErr) {
        console.error('Calendar event cleanup failed on task delete:', calendarErr.message);
      }
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
      task.activityLogs.push({
    action: "Submitted for Approval",
    performedBy: req.user._id,
    timestamp: new Date()
});
      // Notify all management roles (Admins and Managers)
      const mgmtUsers = await User.find({ role: { $in: ['admin', 'manager'] }, active: true });
      for (const user of mgmtUsers) {
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
    if (req.user.role === 'member' && !task.assignedTo.some(userId => userId.toString() === req.user._id.toString())) {
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
    if (req.user.role === 'member' && !task.assignedTo.some(userId => userId.toString() === req.user._id.toString())) {
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

// GET /api/tasks/sidebar-stats
router.get("/sidebar-stats", async (req, res) => {
   console.log("====== SIDEBAR STATS ROUTE HIT ======");
  console.log("USER:", req.user);
  try {
    const query = {};

    // Members only see their own tasks
    if (req.user.role === "member") {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query);

    const today = new Date();

    const stats = {
      total: tasks.length,

      pending: tasks.filter(
        t => t.status === "TO DO"
      ).length,

      inProgress: tasks.filter(
        t => t.status === "In Progress"
      ).length,

      pendingApproval: tasks.filter(
        t => t.status === "Completed (Pending Approval)"
      ).length,

      approved: tasks.filter(
        t => t.status === "Approved"
      ).length,

      overdue: tasks.filter(
        t =>
          t.dueDate &&
          new Date(t.dueDate) < today &&
          t.status !== "Approved"
      ).length,

      dueToday: tasks.filter(t => {

        if (!t.dueDate) return false;

        const d = new Date(t.dueDate);

        return (
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );

      }).length,
    };

    res.json(stats);

  } catch (err) {

    console.error("========== SIDEBAR STATS ERROR ==========");
    console.error(err);
    console.error(err.stack);

    res.status(500).json({
        error: err.message,
        stack: err.stack,
    });
  }
});

module.exports = router;

