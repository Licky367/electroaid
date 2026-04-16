const mongoose = require('mongoose');

const { Schema } = mongoose;

/* ================= ADMINS ================= */
const adminSchema = new Schema({
  ADMIN_NAME: { type: String, required: true },
  ADMIN_EMAIL: { type: String, required: true, unique: true },
  ADMIN_PHONE: { type: String, unique: true },
  ADMIN_PROFILE_IMAGE: String,
  ADMIN_PASSWORD: { type: String, required: true },

  role: {
    type: String,
    enum: ['SUPER_ADMIN','FINANCIAL_ADMIN','OPERATIONS_ADMIN','OPERATIONAL_ADMIN'],
    required: true
  },

  status: {
    type: String,
    enum: ['active','inactive','suspended'],
    default: 'active'
  },

  reset_token: String,
  reset_expires: Date,
  last_login_at: Date,
  last_login_ip: String

}, { timestamps: true });

/* ================= ADMIN INVITES ================= */
const adminInviteSchema = new Schema({
  ADMIN_EMAIL: String,
  role: {
    type: String,
    enum: ['FINANCIAL_ADMIN','OPERATIONS_ADMIN','OPERATIONAL_ADMIN']
  },
  token: { type: String, unique: true },
  expiresAt: Date,
  status: {
    type: String,
    enum: ['pending','used','expired','revoked'],
    default: 'pending'
  },
  usedAt: Date,
  usedBy: { type: Schema.Types.ObjectId, ref: 'admins' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'admins' }
}, { timestamps: true });

/* ================= CLIENTS ================= */
const clientSchema = new Schema({
  CLIENT_NAME: String,
  CLIENT_EMAIL: { type: String, unique: true },
  CLIENT_PHONE_NUMBER: { type: String, unique: true },
  CLIENT_PROFILE_IMAGE: String,
  CLIENT_PASSWORD: String,
  status: { type: String, default: 'active' }
}, { timestamps: true });

/* ================= PAY AFTER CLIENTS ================= */
const payAfterClientSchema = new Schema({
  clientEmail: { type: String, unique: true }
}, { timestamps: true });

/* ================= PAY AFTER RULES ================= */
const payAfterRuleSchema = new Schema({
  assignmentCountThreshold: Number
}, { timestamps: true });

/* ================= PAYMENT SETTINGS ================= */
const paymentSettingsSchema = new Schema({
  _id: Number,
  depositPercentage: { type: Number, default: 30 },
  payAfterGlobal: { type: Boolean, default: false }
}, { timestamps: true });

/* ================= PAYOUT GROUP RULES ================= */
const payoutGroupSchema = new Schema({
  groupRange: { type: String, unique: true },
  percentage: Number
}, { timestamps: true });

/* ================= CLIENT PASSWORD RESETS ================= */
const clientResetSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'clients' },
  token: { type: String, unique: true },
  expiresAt: Date
}, { timestamps: true });

/* ================= EXPERTS ================= */
const expertSchema = new Schema({
  REG_NO: { type: String, unique: true },
  EXPERT_NAME: String,
  EXPERT_EMAIL: { type: String, unique: true },
  EXPERT_PHONE: { type: String, unique: true },
  EXPERT_PROFILE_IMAGE: String,
  EXPERT_PASSWORD: String,

  status: {
    type: String,
    enum: ['active','inactive','suspended'],
    default: 'active'
  }

}, { timestamps: true });

/* ================= EXPERT REGISTRATIONS ================= */
const expertRegSchema = new Schema({
  REG_NO: { type: String, unique: true },
  EXPERT_EMAIL: String,
  createdByAdminId: { type: Schema.Types.ObjectId, ref: 'admins' },
  used: { type: Boolean, default: false },
  expiresAt: Date
}, { timestamps: true });

/* ================= EXPERT PASSWORD RESETS ================= */
const expertResetSchema = new Schema({
  expertId: { type: Schema.Types.ObjectId, ref: 'experts' },
  token: { type: String, unique: true },
  expiresAt: Date
}, { timestamps: true });

/* ================= ASSIGNMENTS ================= */
const assignmentSchema = new Schema({
  CLIENT_ID: { type: Schema.Types.ObjectId, ref: 'clients' },
  EXPERT_ID: { type: Schema.Types.ObjectId, ref: 'experts' },

  REG_NO: String,
  reference: { type: String, unique: true },

  subject: String,
  title: String,

  status: {
    type: String,
    enum: ['pending','accepted','In Progress','Revision Requested','completed','declined'],
    default: 'pending'
  },

  deadline: Date,
  dueDate: Date,

  budget: Number,
  payout: Number,
  profit: Number,

  depositAmount: Number,
  depositPaid: Number,
  totalPaid: Number,

  rating: Number,
  feedback: String,

  completedAt: Date,
  acceptedAt: Date,

  CLIENT_NAME: String,
  EXPERT_NAME: String,

  instructions: String,
  approvalLocked: Boolean,

  declinedByAdminId: { type: Schema.Types.ObjectId, ref: 'admins' },
  declineReason: String,
  declinedAt: Date

}, { timestamps: true });

/* ================= ASSIGNMENT FILES ================= */
const assignmentFileSchema = new Schema({
  reference: String,
  fileUrl: String,
  fileName: String
}, { timestamps: true });

/* ================= ASSIGNMENT DAILY COUNTS ================= */
const dailyCountSchema = new Schema({
  date: { type: Date, unique: true },
  academicCount: Number,
  articleCount: Number,
  codingCount: Number,
  totalCount: Number
});

/* ================= CHAT ================= */
const chatSchema = new Schema({
  CLIENT_ID: { type: Schema.Types.ObjectId, ref: 'clients' },
  ADMIN_ID: { type: Schema.Types.ObjectId, ref: 'admins' },
  senderRole: { type: String, enum: ['client','admin'] },
  message: String,
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

/* ================= MESSAGES ================= */
const messageSchema = new Schema({
  clientId: { type: Schema.Types.ObjectId, ref: 'clients' },
  conversationId: Schema.Types.ObjectId,
  message: String,
  senderRole: { type: String, enum: ['client','admin'] },
  senderId: Schema.Types.ObjectId,
  messageType: { type: String, enum: ['text','file','image'], default: 'text' },
  fileUrl: String,
  fileName: String,
  isRead: { type: Boolean, default: false },
  deliveredAt: Date,
  seenAt: Date
}, { timestamps: true });

/* ================= COMMENTS ================= */
const commentSchema = new Schema({
  reference: String,
  message: String,
  isClient: Boolean
}, { timestamps: true });

/* ================= EXPERT WEEKLY PAYMENTS ================= */
const expertPaymentSchema = new Schema({
  EXPERT_ID: { type: Schema.Types.ObjectId, ref: 'experts' },
  REG_NO: String,
  weekStart: Date,
  weekEnd: Date,
  amountUSD: Number,
  amountKES: Number,

  status: {
    type: String,
    enum: ['PENDING','PROCESSING','PAID','FAILED'],
    default: 'PENDING'
  },

  paymentReference: String,
  transactionCode: String,
  retryCount: Number,
  nextRetryAt: Date,
  paidAt: Date

}, { timestamps: true });

/* ================= PAYMENTS ================= */
const paymentSchema = new Schema({
  reference: String,
  CLIENT_ID: { type: Schema.Types.ObjectId, ref: 'clients' },
  method: { type: String, enum: ['mpesa','paypal','card'] },
  accountIdentifier: String,
  amount_USD: Number,
  amount_KES: Number,
  exchangeRate: Number,
  type: { type: String, enum: ['deposit','full','arrears','after'] },

  status: {
    type: String,
    enum: ['INITIATED','PENDING','SUCCESS','FAILED','CANCELLED'],
    default: 'INITIATED'
  },

  externalRef: { type: String, unique: true },
  transactionCode: String

}, { timestamps: true });

/* ================= SUBMISSIONS ================= */
const submissionSchema = new Schema({
  reference: String,
  fileUrl: String,
  fileName: String,
  submissionText: String,

  type: {
    type: String,
    enum: ['submission','comment','revision_request','feedback']
  },

  isClient: Boolean,
  rating: Number

}, { timestamps: true });

/* ================= PAY AFTER ASSIGNMENTS ================= */
const payAfterAssignmentSchema = new Schema({
  reference: { type: String, unique: true }
}, { timestamps: true });

/* ================= EXPORT ALL ================= */
module.exports = {
  Admin: mongoose.model('admins', adminSchema),
  AdminInvite: mongoose.model('admin_invites', adminInviteSchema),
  Client: mongoose.model('clients', clientSchema),
  PayAfterClient: mongoose.model('pay_after_clients', payAfterClientSchema),
  PayAfterRule: mongoose.model('pay_after_rules', payAfterRuleSchema),
  PaymentSettings: mongoose.model('payment_settings', paymentSettingsSchema),
  PayoutGroupRule: mongoose.model('payout_group_rules', payoutGroupSchema),
  ClientReset: mongoose.model('client_password_resets', clientResetSchema),
  Expert: mongoose.model('experts', expertSchema),
  ExpertRegistration: mongoose.model('expert_registrations', expertRegSchema),
  ExpertReset: mongoose.model('expert_password_resets', expertResetSchema),
  Assignment: mongoose.model('assignments', assignmentSchema),
  AssignmentFile: mongoose.model('assignment_files', assignmentFileSchema),
  DailyCount: mongoose.model('assignment_daily_counts', dailyCountSchema),
  ChatMessage: mongoose.model('chat_messages', chatSchema),
  Message: mongoose.model('messages', messageSchema),
  Comment: mongoose.model('comments', commentSchema),
  ExpertPayment: mongoose.model('expert_weekly_payments', expertPaymentSchema),
  Payment: mongoose.model('payments', paymentSchema),
  Submission: mongoose.model('submissions', submissionSchema),
  PayAfterAssignment: mongoose.model('pay_after_assignments', payAfterAssignmentSchema)
};