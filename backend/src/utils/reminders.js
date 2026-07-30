const cron = require('node-cron');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { sendInAppNotification } = require('./socket');
const { logAction } = require('./audit');

const sendEmail = require('./sendEmail');
const User = require("../models/User");

const checkReminders = async () => {
  const now = new Date();

  try {
    // 1. Check for tasks due in 24 hours (between 23 and 25 hours from now)
    const target24hStart = new Date(now.getTime() + 1 * 60 * 1000); // 1 minute later
    const target24hEnd = new Date(now.getTime() + 3 * 60 * 1000);   // 3 minutes later
    const upcomingTasks = await Task.find({
      status: {
        $nin: ['Approved', 'Completed (Pending Approval)']
      },

      deadlineReminderSent: false,

      dueDate: {
        $gte: target24hStart,
        $lte: target24hEnd
      }
    });

    for (const task of upcomingTasks) {
      for (const userId of task.assignedTo) {
        const exists = await Notification.findOne({
          userId,
          type: 'reminder',
          message: { $regex: new RegExp(`due in 24 hours`, 'i') },
          createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        });
        if (!exists) {
          const message = `Task "${task.title}" is due in 24 hours.`;
          const notification = new Notification({
            userId,
            message,
            type: 'reminder'
          });
          await notification.save();
          sendInAppNotification(userId, notification);
          const user = await User.findById(userId);

          if (user && user.email) {
            await sendEmail(
              user.email,
              "⏰ Deadline Approaching",
              `
              <h2>Hello ${user.name},</h2>

              <p>Your task <b>${task.title}</b> is due in <b>24 hours</b>.</p>

              <p>Please complete it before the deadline.</p>

              <hr>

              <p>
                Due Date:
                <b>${new Date(task.dueDate).toLocaleString()}</b>
              </p>

              <p>Regards,<br>TaskSphere Team</p>
            `
            );
            task.deadlineReminderSent = true;
            await task.save();
          }
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
