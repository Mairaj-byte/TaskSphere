const cron = require('node-cron');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const SystemSettings = require('../models/SystemSettings');
const { sendInAppNotification } = require('./socket');
const { logAction } = require('./audit');

const checkReminders = async () => {
  const now = new Date();

  // Load admin-configurable settings; fall back to the previous hardcoded
  // defaults (24h reminder window, escalation on, 2 days) if this is the
  // first run or the settings read fails for any reason — so this never
  // breaks the existing reminder behavior for anyone who hasn't touched
  // the new Admin Settings panel yet.
  let reminderHoursBeforeDue = 24;
  let escalationEnabled = true;
  let daysOverdueForEscalation = 2;
  let dailyOverdueReminder = true;
  try {
    const settings = await SystemSettings.getSingleton();
    reminderHoursBeforeDue = settings.notificationRules?.reminderHoursBeforeDue || 24;
    escalationEnabled = settings.escalation?.enabled !== false;
    daysOverdueForEscalation = settings.escalation?.daysOverdueForEscalation || 2;
    dailyOverdueReminder = settings.notificationRules?.dailyOverdueReminder !== false;
  } catch (settingsErr) {
    console.error('Could not load SystemSettings, using defaults:', settingsErr.message);
  }

  try {
    // 1. Check for tasks due in `reminderHoursBeforeDue` hours (±1 hour window)
    const target24hStart = new Date(now.getTime() + (reminderHoursBeforeDue - 1) * 60 * 60 * 1000);
    const target24hEnd = new Date(now.getTime() + (reminderHoursBeforeDue + 1) * 60 * 60 * 1000);
    const upcomingTasks = await Task.find({
      status: { $nin: ['Approved', 'Completed (Pending Approval)'] },
      dueDate: { $gte: target24hStart, $lte: target24hEnd }
    });

    for (const task of upcomingTasks) {
      for (const userId of task.assignedTo) {
        const exists = await Notification.findOne({
          userId,
          type: 'reminder',
         message: { $regex: new RegExp(`due in ${reminderHoursBeforeDue} hours`, 'i') },
          createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        });
        if (!exists) {
          const message = `Task "${task.title}" is due in ${reminderHoursBeforeDue} hours.`;
          const notification = new Notification({
            userId,
            message,
            type: 'reminder'
          });
          await notification.save();
          sendInAppNotification(userId, notification);
        }
      }
    }

    // 2. Check for tasks due today (due date today, within next 24h)
    const targetTodayStart = new Date(now.getTime());
    const targetTodayEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dueTodayTasks = await Task.find({
      status: { $nin: ['Approved', 'Completed (Pending Approval)'] },
      dueDate: { $gte: targetTodayStart, $lte: targetTodayEnd }
    });

    for (const task of dueTodayTasks) {
      // Only notify if within 12 hours of the due date (checking hourly)
      for (const userId of task.assignedTo) {
        const exists = await Notification.findOne({
          userId,
          type: 'reminder',
          message: { $regex: new RegExp(`is due today`, 'i') },
          createdAt: { $gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) }
        });
        if (!exists) {
          const message = `Task "${task.title}" is due today.`;
          const notification = new Notification({
            userId,
            message,
            type: 'reminder'
          });
          await notification.save();
          sendInAppNotification(userId, notification);
        }
      }
    }

    // 3. Mark past-due tasks as Overdue
    const overdueTasks = await Task.find({
      status: { $in: ['To Do', 'In Progress', 'Rejected'] },
      dueDate: { $lt: now }
    });

    for (const task of overdueTasks) {
      const oldStatus = task.status;
      task.status = 'Overdue';
      await task.save();

      // Log in AuditLog (attribute to creator or system)
      await logAction({
        taskId: task._id,
        userId: task.createdBy,
        action: 'Status Changed',
        oldValue: oldStatus,
        newValue: 'Overdue'
      });

      for (const userId of task.assignedTo) {
        const message = `Task "${task.title}" is now OVERDUE!`;
        const notification = new Notification({
          userId,
          message,
          type: 'overdue'
        });
        await notification.save();
        sendInAppNotification(userId, notification);
      }
    }

    // 4. Daily overdue reminders for tasks already marked Overdue
       // 4. Daily overdue reminders for tasks already marked Overdue
    // (skipped entirely if the admin has turned this off in Settings)
    if (dailyOverdueReminder) {
      const alreadyOverdueTasks = await Task.find({
        status: 'Overdue'
      });

      for (const task of alreadyOverdueTasks) {
        for (const userId of task.assignedTo) {
          const exists = await Notification.findOne({
            userId,
            type: 'overdue',
            message: { $regex: new RegExp(`remains overdue`, 'i') },
            createdAt: { $gte: new Date(now.getTime() - 22 * 60 * 60 * 1000) }
          });

          if (!exists) {
            const message = `Reminder: Task "${task.title}" remains overdue. Please complete it as soon as possible.`;
            const notification = new Notification({
              userId,
              message,
              type: 'overdue'
            });
            await notification.save();
            sendInAppNotification(userId, notification);
          }
        }
      }
    }

    // 5. Priority escalation — if a task has been Overdue for at least
    // `daysOverdueForEscalation` days, bump its priority one level
    // (Low -> Medium -> High -> Urgent). Urgent stays Urgent. Only runs
    // if escalation is enabled in Settings. This satisfies the spec's
    // "priority escalation flag for overdue tasks" requirement.
    if (escalationEnabled) {
      const escalationCutoff = new Date(now.getTime() - daysOverdueForEscalation * 24 * 60 * 60 * 1000);
      const escalationCandidates = await Task.find({
        status: 'Overdue',
        dueDate: { $lte: escalationCutoff },
        priority: { $ne: 'Urgent' }
      });

      const priorityLadder = { Low: 'Medium', Medium: 'High', High: 'Urgent' };

      for (const task of escalationCandidates) {
        const nextPriority = priorityLadder[task.priority];
        if (!nextPriority) continue;

        const oldPriority = task.priority;
        task.priority = nextPriority;
        task.activityLogs.push({
          action: `Priority auto-escalated from ${oldPriority} to ${nextPriority} (overdue ${daysOverdueForEscalation}+ days)`,
          performedBy: task.createdBy,
          timestamp: new Date(),
        });
        await task.save();

        await logAction({
          taskId: task._id,
          userId: task.createdBy,
          action: 'Priority Escalated',
          oldValue: oldPriority,
          newValue: nextPriority
        });

        for (const userId of task.assignedTo) {
          const message = `Task "${task.title}" priority was escalated to ${nextPriority} (overdue ${daysOverdueForEscalation}+ days).`;
          const notification = new Notification({
            userId,
            message,
            type: 'overdue'
          });
          await notification.save();
          sendInAppNotification(userId, notification);
        }
      }
    }
  } catch (err) {
    console.error('Error running reminder checks:', err);
  }
};

const startScheduler = () => {
  // Check reminders based on CRON_SCHEDULE env (default every hour)
  const scheduleExpr = process.env.CRON_SCHEDULE || '0 * * * *';
  cron.schedule(scheduleExpr, () => {
    checkReminders();
  });
  
  // Also run once on startup
  checkReminders();
};

module.exports = {
  startScheduler,
  checkReminders
};
