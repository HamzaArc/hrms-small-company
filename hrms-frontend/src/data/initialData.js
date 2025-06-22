// Generate unique IDs
let nextId = 1000;
const generateId = () => `${nextId++}`;

// Initial employees data
export const initialEmployees = [
  {
    id: generateId(),
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice.smith@company.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, New York, NY 10001',
    role: 'Software Engineer',
    department: 'Engineering',
    hireDate: '2022-03-15',
    status: 'Active',
    leaveBalances: {
      vacation: 15,
      sick: 10,
      personal: 5
    },
    onboardingTasks: [
      { id: generateId(), task: 'Complete HR paperwork', completed: true, dueDate: '2022-03-20' },
      { id: generateId(), task: 'Setup workstation', completed: true, dueDate: '2022-03-16' },
      { id: generateId(), task: 'Meet with team', completed: true, dueDate: '2022-03-17' },
      { id: generateId(), task: 'Complete security training', completed: false, dueDate: '2022-03-25' }
    ],
    documents: [
      { 
        id: generateId(), 
        name: 'Employment Contract', 
        type: 'Contract', 
        uploadDate: '2022-03-15', 
        expiryDate: '2025-03-15',
        status: 'Active'
      },
      { 
        id: generateId(), 
        name: 'ID Verification', 
        type: 'Identification', 
        uploadDate: '2022-03-15', 
        expiryDate: '2025-08-20',
        status: 'Active'
      }
    ]
  },
  {
    id: generateId(),
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@company.com',
    phone: '+1 (555) 234-5678',
    address: '456 Oak Ave, San Francisco, CA 94102',
    role: 'Product Manager',
    department: 'Product',
    hireDate: '2021-06-01',
    status: 'Active',
    leaveBalances: {
      vacation: 18,
      sick: 8,
      personal: 4
    },
    onboardingTasks: [
      { id: generateId(), task: 'Complete HR paperwork', completed: true, dueDate: '2021-06-05' },
      { id: generateId(), task: 'Setup workstation', completed: true, dueDate: '2021-06-02' },
      { id: generateId(), task: 'Meet with team', completed: true, dueDate: '2021-06-03' }
    ],
    documents: [
      { 
        id: generateId(), 
        name: 'Employment Contract', 
        type: 'Contract', 
        uploadDate: '2021-06-01', 
        expiryDate: '2024-06-01',
        status: 'Active'
      }
    ]
  },
  {
    id: generateId(),
    firstName: 'Carol',
    lastName: 'Williams',
    email: 'carol.williams@company.com',
    phone: '+1 (555) 345-6789',
    address: '789 Pine Rd, Austin, TX 78701',
    role: 'HR Manager',
    department: 'Human Resources',
    hireDate: '2020-01-15',
    status: 'Active',
    leaveBalances: {
      vacation: 20,
      sick: 12,
      personal: 6
    },
    onboardingTasks: [
      { id: generateId(), task: 'Complete HR paperwork', completed: true, dueDate: '2020-01-20' },
      { id: generateId(), task: 'Setup workstation', completed: true, dueDate: '2020-01-16' }
    ],
    documents: [
      { 
        id: generateId(), 
        name: 'Employment Contract', 
        type: 'Contract', 
        uploadDate: '2020-01-15', 
        expiryDate: '2025-01-15',
        status: 'Active'
      },
      { 
        id: generateId(), 
        name: 'Professional Certification', 
        type: 'Certification', 
        uploadDate: '2021-05-10', 
        expiryDate: '2025-05-10',
        status: 'Active'
      }
    ]
  },
  {
    id: generateId(),
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@company.com',
    phone: '+1 (555) 456-7890',
    address: '321 Elm St, Chicago, IL 60601',
    role: 'Marketing Specialist',
    department: 'Marketing',
    hireDate: '2023-02-01',
    status: 'Active',
    leaveBalances: {
      vacation: 10,
      sick: 10,
      personal: 5
    },
    onboardingTasks: [
      { id: generateId(), task: 'Complete HR paperwork', completed: true, dueDate: '2023-02-05' },
      { id: generateId(), task: 'Setup workstation', completed: true, dueDate: '2023-02-02' },
      { id: generateId(), task: 'Marketing tools training', completed: false, dueDate: '2023-02-10' }
    ],
    documents: [
      { 
        id: generateId(), 
        name: 'Employment Contract', 
        type: 'Contract', 
        uploadDate: '2023-02-01', 
        expiryDate: '2026-02-01',
        status: 'Active'
      }
    ]
  }
];

// Initial leave requests
export const initialLeaveRequests = [
  {
    id: generateId(),
    employeeId: initialEmployees[0].id,
    employeeName: 'Alice Smith',
    type: 'Vacation',
    startDate: '2025-07-01',
    endDate: '2025-07-05',
    reason: 'Summer vacation with family',
    requestedDate: '2025-06-15',
    status: 'Pending'
  },
  {
    id: generateId(),
    employeeId: initialEmployees[1].id,
    employeeName: 'Bob Johnson',
    type: 'Sick',
    startDate: '2025-06-10',
    endDate: '2025-06-11',
    reason: 'Medical appointment',
    requestedDate: '2025-06-08',
    status: 'Approved'
  },
  {
    id: generateId(),
    employeeId: initialEmployees[2].id,
    employeeName: 'Carol Williams',
    type: 'Personal',
    startDate: '2025-06-25',
    endDate: '2025-06-26',
    reason: 'Personal matters',
    requestedDate: '2025-06-18',
    status: 'Pending'
  }
];

// Initial timesheets
export const initialTimesheets = [
  {
    id: generateId(),
    employeeId: initialEmployees[0].id,
    employeeName: 'Alice Smith',
    date: '2025-06-19',
    hours: 8,
    description: 'Frontend development - User dashboard'
  },
  {
    id: generateId(),
    employeeId: initialEmployees[0].id,
    employeeName: 'Alice Smith',
    date: '2025-06-18',
    hours: 7.5,
    description: 'Code review and bug fixes'
  },
  {
    id: generateId(),
    employeeId: initialEmployees[1].id,
    employeeName: 'Bob Johnson',
    date: '2025-06-19',
    hours: 8,
    description: 'Product roadmap planning'
  },
  {
    id: generateId(),
    employeeId: initialEmployees[3].id,
    employeeName: 'David Brown',
    date: '2025-06-19',
    hours: 8,
    description: 'Social media campaign development'
  }
];

// Initial goals
export const initialGoals = [
  {
    id: generateId(),
    employeeId: initialEmployees[0].id,
    employeeName: 'Alice Smith',
    objective: 'Complete React Native certification',
    dueDate: '2025-09-30',
    status: 'In Progress',
    keyResults: [
      'Complete online course modules',
      'Build a sample mobile application',
      'Pass certification exam'
    ]
  },
  {
    id: generateId(),
    employeeId: initialEmployees[1].id,
    employeeName: 'Bob Johnson',
    objective: 'Launch new product feature',
    dueDate: '2025-08-15',
    status: 'In Progress',
    keyResults: [
      'Complete market research',
      'Define feature requirements',
      'Coordinate with engineering team'
    ]
  },
  {
    id: generateId(),
    employeeId: initialEmployees[3].id,
    employeeName: 'David Brown',
    objective: 'Increase social media engagement by 25%',
    dueDate: '2025-12-31',
    status: 'Not Started',
    keyResults: [
      'Develop content calendar',
      'Implement A/B testing strategy',
      'Track and analyze metrics'
    ]
  }
];

// Initial performance reviews
export const initialReviews = [
  {
    id: generateId(),
    employeeId: initialEmployees[0].id,
    employeeName: 'Alice Smith',
    reviewDate: '2025-01-15',
    reviewer: 'John Manager',
    rating: 4.5,
    comments: 'Excellent performance, consistently delivers high-quality code. Great team player.',
    linkedGoals: []
  },
  {
    id: generateId(),
    employeeId: initialEmployees[1].id,
    employeeName: 'Bob Johnson',
    reviewDate: '2025-01-20',
    reviewer: 'Sarah Director',
    rating: 4.0,
    comments: 'Strong product vision and leadership skills. Successfully launched two major features.',
    linkedGoals: []
  }
];

// Initial announcements
export const initialAnnouncements = [
  {
    id: generateId(),
    title: 'Summer Office Hours',
    content: 'Starting July 1st, our office hours will be 8 AM to 4 PM for the summer months.',
    date: '2025-06-15',
    author: 'HR Team'
  },
  {
    id: generateId(),
    title: 'Welcome New Team Members',
    content: 'Please join us in welcoming our new team members who joined us this month!',
    date: '2025-06-10',
    author: 'Management'
  },
  {
    id: generateId(),
    title: 'Q2 Company Meeting',
    content: 'Our quarterly all-hands meeting is scheduled for June 30th at 2 PM.',
    date: '2025-06-05',
    author: 'CEO'
  }
];

// Initial recognitions
export const initialRecognitions = [
  {
    id: generateId(),
    recipientId: initialEmployees[0].id,
    recipientName: 'Alice Smith',
    message: 'Outstanding work on the latest product release! Your dedication is inspiring.',
    date: '2025-06-18',
    givenBy: 'Bob Johnson'
  },
  {
    id: generateId(),
    recipientId: initialEmployees[3].id,
    recipientName: 'David Brown',
    message: 'Great job on the marketing campaign! The results exceeded expectations.',
    date: '2025-06-16',
    givenBy: 'Carol Williams'
  }
];