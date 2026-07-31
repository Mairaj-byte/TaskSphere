const cron = require("node-cron");
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const { sendInAppNotification } = require("./socket");
const { logAction } = require("./audit");
const sendEmail = require("./sendEmail");
const User = require("../models/User");

const checkReminders = async () => {
  console.log("Reminder Scheduler Running...");

  const now = new Date();

  try {
    // ================================
    // PRODUCTION WINDOW (24 HOURS)
    // ================================
    const reminderStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const reminderEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    console.log("Current Time :", now);
    console.log("Reminder Start :", reminderStart);
    console.log("Reminder End :", reminderEnd);

    // ================================
    // DEADLINE REMINDER
    // ================================
    const upcomingTasks = await Task.find({
      status: {
        $nin: [
          "Approved",
          "Completed",
          "Completed (Pending Approval)",
          "Overdue",
        ],
      },

      deadlineReminderSent: false,

      dueDate: {
        $gte: reminderStart,
        $lte: reminderEnd,
      },
    });

    console.log("Upcoming Tasks Found :", upcomingTasks.length);

    for (const task of upcomingTasks) {
      console.log("Reminder Triggered For :", task.title);

      for (const userId of task.assignedTo) {

        const message = `Task "${task.title}" is due soon.`;

        const notification = new Notification({
          userId,
          message,
          type: "reminder",
        });

        await notification.save();

        sendInAppNotification(userId, notification);

        const user = await User.findById(userId);

        if (user?.email) {
          console.log("Sending Reminder Email To :", user.email);

          await sendEmail(
            user.email,
            "⏰ Deadline Approaching",
            `
            <h2>Hello ${user.name},</h2>

            <p>Your task <b>${task.title}</b> will reach its deadline soon.</p>

            <p>Please complete it before the deadline.</p>

            <hr>

            <p><b>Due Date :</b> ${new Date(task.dueDate).toLocaleString()}</p>

            <br>

            <p>Regards,</p>
            <p>TaskSphere Team</p>
            `
          );

          console.log("Reminder Email Sent Successfully");

          
        }
          
      }
          task.deadlineReminderSent = true;
          await task.save();
          console.log("deadlineReminderSent updated for:", task.title);
    }

    // ================================
    // DUE TODAY
    // ================================
    const dueTodayTasks = await Task.find({
      status: {
        $nin: ["Approved", "Completed", "Completed (Pending Approval)"],
      },
      dueDate: {
        $gte: now,
        $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    for (const task of dueTodayTasks) {
      for (const userId of task.assignedTo) {
        const exists = await Notification.findOne({
          userId,
          type: "reminder",
          message: {
            $regex: /due today/i,
          },
        });

        if (exists) continue;

        const notification = new Notification({
          userId,
          message: `Task "${task.title}" is due today.`,
          type: "reminder",
        });

        await notification.save();

        sendInAppNotification(userId, notification);
      }
    }

    // ================================
    // MARK OVERDUE
    // ================================
    const overdueTasks = await Task.find({
      status: {
        $in: ["To Do", "In Progress", "Rejected"],
      },
      dueDate: {
        $lt: now,
      },
    });

    for (const task of overdueTasks) {
      const oldStatus = task.status;

      task.status = "Overdue";

      await task.save();

      await logAction({
        taskId: task._id,
        userId: task.createdBy,
        action: "Status Changed",
        oldValue: oldStatus,
        newValue: "Overdue",
      });

      for (const userId of task.assignedTo) {
        const notification = new Notification({
          userId,
          message: `Task "${task.title}" is now OVERDUE!`,
          type: "overdue",
        });

        await notification.save();

        sendInAppNotification(userId, notification);
      }
    }

    // ================================
    // DAILY OVERDUE REMINDER
    // ================================
    const overdueReminderTasks = await Task.find({
      status: "Overdue",
    });

    for (const task of overdueReminderTasks) {
      for (const userId of task.assignedTo) {
        const exists = await Notification.findOne({
          userId,
          type: "overdue",
          message: {
            $regex: /remains overdue/i,
          },
        });

        if (exists) continue;

        const notification = new Notification({
          userId,
          message: `Reminder: Task "${task.title}" remains overdue.`,
          type: "overdue",
        });

        await notification.save();

        sendInAppNotification(userId, notification);
      }
    }
  } catch (err) {
    console.error(err);
  }
};

const startScheduler = () => {
  cron.schedule("0 * * * *", () => {
    checkReminders();
  });

  console.log("Running reminder check on startup...");
  checkReminders();
};

module.exports = {
  startScheduler,
  checkReminders,
};