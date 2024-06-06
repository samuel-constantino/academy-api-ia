import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Types for Entities
interface PublicInfo {
  location: string;
  equipment: string[];
  hours: string;
  plans: Plan[];
}

interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  planId: number;
}

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  enrollmentDate: Date;
  plan: Plan;
}

interface Professional {
  id: number;
  name: string;
  specialty: string;
  email: string;
  phone: string;
}

interface Report {
  id: number;
  type: string;
  content: string;
  date: Date;
}

interface Plan {
  id: number;
  name: string;
  durationMonths: number;
  price: number;
}

// Mocked Data
const students: Student[] = [];
const professionals: Professional[] = [];
const reports: Report[] = [];
const plans: Plan[] = [
  { id: 1, name: 'Monthly', durationMonths: 1, price: 50 },
  { id: 2, name: 'Quarterly', durationMonths: 3, price: 135 },
  { id: 3, name: 'Annual', durationMonths: 12, price: 480 },
];

// Public Routes
app.get('/public/info', (req: Request, res: Response) => {
  const info: PublicInfo = {
    location: '123 Example Street',
    equipment: ['Treadmills', 'Free weights', 'Strength machines'],
    hours: 'Monday to Friday: 6am - 10pm, Saturday: 8am - 6pm, Sunday: 8am - 2pm',
    plans
  };
  res.json(info);
});

// Enrollment Route
app.post('/register', (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  const { name, email, phone, planId } = req.body;
  const selectedPlan = plans.find(plan => plan.id === planId);

  if (!selectedPlan) {
    return res.status(400).json({ message: 'Invalid plan selected' });
  }

  const newStudent: Student = {
    id: students.length + 1,
    name,
    email,
    phone,
    enrollmentDate: new Date(),
    plan: selectedPlan
  };

  students.push(newStudent);
  res.json({ message: 'Registration successful!', data: newStudent });
});

// Basic authentication middleware for administration
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { admintoken } = req.headers;
  if (admintoken === 'secrettoken') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied' });
  }
};

// Administration Routes
app.use('/admin', authMiddleware);

app.get('/admin/students', (req: Request, res: Response) => {
  res.json({ students });
});

app.get('/admin/professionals', (req: Request, res: Response) => {
  res.json({ professionals });
});

app.get('/admin/reports', (req: Request, res: Response) => {
  res.json({ reports });
});

// Start the server
app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
