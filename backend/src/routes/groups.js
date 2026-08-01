const express = require("express");
const router = express.Router();

const Group = require("../models/Group");
const Task = require("../models/Task");
const User = require("../models/User");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");
const {
    sendInAppNotification
} = require("../utils/socket");

const {
  authenticate,
  requireRole
} = require("../middleware/auth");

/* ==========================================================
   CREATE GROUP
========================================================== */

router.post(
    "/",
    authenticate,
    requireRole(["admin"]),
    async (req, res) => {

        try {

            const {
                name,
                description,
                members = []
            } = req.body;

            const group = await Group.create({
                name,
                description,
                members,
                createdBy: req.user._id
            });

            const users = await User.find({
                _id: {
                    $in: members
                }
            });

            for (const user of users) {

                const notification = await Notification.create({

                    userId: user._id,

                    message: `You have been assigned to project "${group.name}"`,

                    type: "project"

                });

                await sendInAppNotification(
                    user._id,
                    notification
                );

                await sendEmail(

                    user.email,

                    "New Project Assigned",

                    `
                    <h2>Hello ${user.name}</h2>

                    <p>You have been assigned to a new project.</p>

                    <h3>${group.name}</h3>

                    <p>${description}</p>

                    <br>

                    <p>Please login to TaskSphere.</p>
                    `

                );

            }

            res.status(201).json(group);

        }

        catch(err){

            console.error(err);

            res.status(500).json({
                error:err.message
            });

        }

    }
);

/* ==========================================================
   GET ALL GROUPS
========================================================== */

router.get(
  "/",
  authenticate,
  async (req, res) => {
   try {

     // Members should only see projects they've actually been added to.
     // Admins and managers still see every project (they manage/oversee
     // work across the org, not just their own assignments).
     const filter = req.user.role === "member"
       ? { members: req.user._id }
       : {};

     const groups = await Group.find(filter)
  .populate("members", "name email role profilePhoto")
  .populate("createdBy", "name email");

const groupsWithStats = await Promise.all(
  groups.map(async (group) => {
    const tasks = await Task.find({ group: group._id });

    const completed = tasks.filter(
      (t) => t.status === "Completed"
    ).length;

    const pending = tasks.filter(
      (t) => t.status === "Pending"
    ).length;

    const overdue = tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.status !== "Completed"
    ).length;

    const progress =
      tasks.length === 0
        ? 0
        : Math.round((completed / tasks.length) * 100);

    return {
      ...group.toObject(),
      stats: {
        totalTasks: tasks.length,
        completed,
        pending,
        overdue,
        progress,
      },
    };
  })
);

res.json(groupsWithStats);

    } catch (err) {
      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* ==========================================================
   GET SINGLE GROUP
========================================================== */

router.get(
  "/:id",
  authenticate,
  async (req, res) => {
    try {

     const group = await Group.findById(req.params.id)
  .populate(
    "members",
    "name email role profilePhoto department designationRole"
  )
  .populate(
    "createdBy",
    "name email profilePhoto"
  );

     if (!group) {
        return res.status(404).json({
          error: "Group not found"
        });
      }

      // Same restriction as the list endpoint: a member who isn't part of
      // this project shouldn't be able to view it just by knowing/guessing
      // its URL.
      if (req.user.role === "member") {
        const isMember = group.members.some(
          (m) => m._id.toString() === req.user._id.toString()
        );
        if (!isMember) {
          return res.status(403).json({
            error: "Forbidden. You are not a member of this project."
          });
        }
      }

      res.json(group);

    } catch (err) {
      res.status(500).json({
        error: err.message
      });
    }
  }
);

/* ==========================================================
   UPDATE GROUP
========================================================== */

router.put(
  "/:id",
  authenticate,
 requireRole(["admin", "manager"]),
  async (req, res) => {

    try {

      const group = await Group.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true
        }
      );

      res.json(group);

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }

  }
);

/* ==========================================================
   DELETE GROUP
========================================================== */

router.delete(
  "/:id",
  authenticate,
  requireRole(["admin"]),
  async (req, res) => {

    try {

      await Group.findByIdAndDelete(req.params.id);

      res.json({
        message: "Group deleted successfully."
      });

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }

  }
);

/* ==========================================================
   ADD MEMBER
========================================================== */

router.post(
  "/:id/member",
  authenticate,
  requireRole(["admin"]),
  async (req, res) => {

    try {

      const group = await Group.findById(req.params.id);

      if (!group)
        return res.status(404).json({
          error: "Group not found"
        });

      if (!group.members.includes(req.body.userId)) {
        group.members.push(req.body.userId);
      }

      await group.save();

     const updatedGroup = await Group.findById(group._id)
  .populate(
    "members",
    "name email role profilePhoto department designationRole"
  )
  .populate(
    "createdBy",
    "name email profilePhoto"
  );

res.json(updatedGroup);

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }

  }
);

/* ==========================================================
   REMOVE MEMBER
========================================================== */

router.delete(
  "/:id/member/:userId",
  authenticate,
  requireRole(["admin"]),
  async (req, res) => {

    try {

      const group = await Group.findById(req.params.id);

      if (!group)
        return res.status(404).json({
          error: "Group not found"
        });

      group.members = group.members.filter(
        m => m.toString() !== req.params.userId
      );

      await group.save();

const updatedGroup = await Group.findById(group._id)
  .populate(
    "members",
    "name email role profilePhoto designationRole department"
  )
  .populate(
    "createdBy",
    "name email profilePhoto"
  );

res.json(updatedGroup);

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }

  }
);

/* ==========================================================
   GROUP TASKS
========================================================== */

router.get(
  "/:id/tasks",
  authenticate,
  async (req, res) => {

    try {

      const tasks = await Task.find({
        group: req.params.id
      })
        .populate("assignedTo", "name")
        .populate("createdBy", "name");

      res.json(tasks);

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }

  }
);

module.exports = router;