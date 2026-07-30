const mongoose = require('mongoose');

// Checklist Items
const checklistSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { _id: true });

// Activity Timeline
const activitySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
  type: Date
},

estimatedHours: {
  type: Number,
  default: 0
},
  status: {
    type: String,
   enum: [
  'To Do',
  'In Progress',
  'In Review',
  'Completed (Pending Approval)',
  'Approved',
  'Rejected',
  'Blocked',
  'Overdue'
],
    default: 'To Do'
  },
  priority: {
    type: String,
   enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  dueDate: {
    type: Date,
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  group:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Group",
    default:null
},
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  feedback: {
    type: String,
    default: ''
  },
  attachments: [{
    type: String
  }],
  tags: [{
  type: String
}],

checklist: [checklistSchema],

dependencies: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Task'
}],

isRecurring: {
  type: Boolean,
  default: false
},

recurringType: {
  type: String,
  enum: ['Daily', 'Weekly', 'Monthly'],
  default: null
},

isArchived: {
  type: Boolean,
  default: false
},

deadlineReminderSent: {
  type: Boolean,
  default: false
},

activityLogs: [activitySchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
