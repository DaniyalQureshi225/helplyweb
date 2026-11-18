export const BRAND = {
  name: 'HELPY',
  tagline: 'Your Comfort, Our Priority.',
  description:
    'Enjoy a smoother experience wherever you go. HELPY connects you with trusted assistance at hotels, shopping malls, airports, and public places.',
};

export const SERVICE_REQUEST_STATUS = {
  CREATED: 'CREATED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const REQUEST_STATUS_FLOW = ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];

export const STATUS_LABELS = {
  CREATED: 'Requested',
  ASSIGNED: 'Helper assigned',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  PAID: 'Paid',
  APPROVED: 'Approved',
  TIE: 'Tie — review needed',
  GENERATED: 'Generated',
  VOID: 'Void',
  UNPAID: 'Unpaid',
  PARTIAL: 'Partially paid',
  CONFIRMED: 'Confirmed',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  OPEN: 'Open',
  UNDER_REVIEW: 'Under review',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  PRESENT: 'Present',
  ABSENT: 'Absent',
  WEEKLY_OFF: 'Weekly off',
  LEAVE: 'Leave',
  HOLIDAY: 'Holiday',
  PENDING_REVIEW: 'Pending review',
  DECIDED: 'Decided',
  DISMISSED: 'Dismissed',
  ACCRUED: 'Accrued',
  RECORDING: 'Recording',
  ENDED: 'Ended',
  FINALIZED: 'Finalized',
  DELETED: 'Deleted',
  FLAGGED: 'Flagged',
  CANCELLED_INCENTIVE: 'Cancelled',
};

export const STATUS_TONES = {
  CREATED: 'amber',
  ASSIGNED: 'blue',
  IN_PROGRESS: 'teal',
  COMPLETED: 'green',
  CANCELLED: 'gray',
  PENDING: 'amber',
  VERIFIED: 'green',
  REJECTED: 'red',
  PAID: 'green',
  APPROVED: 'green',
  TIE: 'orange',
  GENERATED: 'blue',
  VOID: 'gray',
  UNPAID: 'red',
  PARTIAL: 'orange',
  CONFIRMED: 'green',
  FAILED: 'red',
  REFUNDED: 'gray',
  OPEN: 'amber',
  UNDER_REVIEW: 'blue',
  RESOLVED: 'green',
  CLOSED: 'gray',
  PRESENT: 'green',
  ABSENT: 'red',
  WEEKLY_OFF: 'blue',
  LEAVE: 'amber',
  HOLIDAY: 'blue',
  PENDING_REVIEW: 'amber',
  DECIDED: 'blue',
  DISMISSED: 'gray',
  ACCRUED: 'blue',
  RECORDING: 'red',
  ENDED: 'blue',
  FINALIZED: 'green',
  DELETED: 'gray',
  FLAGGED: 'orange',
};

export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'JAZZCASH', label: 'JazzCash' },
  { value: 'EASYPAISA', label: 'Easypaisa' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'OTHER', label: 'Other' },
];

export const CUSTOMER_PAYMENT_METHODS = PAYMENT_METHODS.filter((method) => method.value !== 'CASH');

export const TIP_OPTIONS = [0, 50, 100, 200];

export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'WEEKLY_OFF', 'LEAVE', 'HOLIDAY'];

export const COMPLAINT_CATEGORIES = [
  { value: 'SERVICE_QUALITY', label: 'Service quality' },
  { value: 'BILLING', label: 'Billing' },
  { value: 'BEHAVIOUR', label: 'Behaviour' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'LOST_ITEM', label: 'Lost item' },
  { value: 'RECORDING_MISUSE', label: 'Recording misuse' },
  { value: 'OTHER', label: 'Other' },
];

export const INCENTIVE_TYPES = [
  { value: 'FIVE_STAR_DAILY', label: 'Daily five-star reward' },
  { value: 'MONTHLY_ATTENDANCE', label: 'Monthly attendance' },
  { value: 'CONSISTENCY', label: 'Consistency (3 months)' },
  { value: 'TIP_CHAMPION', label: 'Tip Champion' },
  { value: 'MANUAL', label: 'Manual award' },
];

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export const ADMIN_NAV = [
  {
    group: 'Overview',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
      { href: '/admin/reports', label: 'Reports', icon: 'BarChart3' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { href: '/admin/requests', label: 'Requests', icon: 'ClipboardList' },
      { href: '/admin/sessions', label: 'Sessions', icon: 'Timer' },
      { href: '/admin/billing', label: 'Billing', icon: 'ReceiptText' },
      { href: '/admin/payments', label: 'Payments', icon: 'CreditCard' },
      { href: '/admin/recordings', label: 'Recordings', icon: 'AudioLines' },
    ],
  },
  {
    group: 'People',
    items: [
      { href: '/admin/helpers', label: 'Helpers', icon: 'Users' },
      { href: '/admin/customers', label: 'Customers', icon: 'UserRound' },
    ],
  },
  {
    group: 'Catalog',
    items: [
      { href: '/admin/services', label: 'Services', icon: 'Sparkles' },
      { href: '/admin/locations', label: 'Locations', icon: 'MapPin' },
      { href: '/admin/qr-codes', label: 'QR codes', icon: 'QrCode' },
    ],
  },
  {
    group: 'Engagement',
    items: [
      { href: '/admin/reviews', label: 'Reviews', icon: 'Star' },
      { href: '/admin/tips', label: 'Tips', icon: 'HandCoins' },
      { href: '/admin/tip-champion', label: 'Tip Champion', icon: 'Trophy' },
      { href: '/admin/complaints', label: 'Complaints', icon: 'MessageSquareWarning' },
      { href: '/admin/disciplinary', label: 'Disciplinary', icon: 'Gavel' },
    ],
  },
  {
    group: 'Workforce',
    items: [
      { href: '/admin/attendance', label: 'Attendance', icon: 'CalendarCheck2' },
      { href: '/admin/incentives', label: 'Incentives', icon: 'BadgePlus' },
    ],
  },
  {
    group: 'System',
    items: [{ href: '/admin/settings', label: 'Settings', icon: 'Settings' }],
  },
];

export const PUBLIC_NAV = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
];
