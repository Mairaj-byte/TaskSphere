const express = require("express");
const router = express.Router();

const Group = require("../models/Group");
const Task = require("../models/Task");

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

      const group = await Group.create({
        name: req.body.name,
        description: req.body.description,
        members: req.body.members || [],
        createdBy: req.user._id
      });

      res.status(201).json(group);

    } catch (err) {
      res.status(500).json({
        error: err.message
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

     const groups = await Group.find()
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

      res.json(groups);

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
        .populate("members")
        .populate("createdBy");

      if (!group) {
        return res.status(404).json({
          error: "Group not found"
        });
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
  requireRole(["admin"]),
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

      res.json(group);

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

      res.json(group);

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