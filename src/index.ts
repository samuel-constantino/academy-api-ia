import express, { Request, Response, NextFunction } from 'express';
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Types for Entities
interface PublicInfo {
  location: Address;
  equipments: string[];
  hours: string[];
  plans: Plan[];
}

interface RegisterRequest {
  clientId: number;
  planId: number;
}

interface Address {
  id: number;
  street: string;
  city: string;
  neighborhood: string;
  number: string;
}

interface Client {
  id: number;
  name: string;
  cpf: number;
  rg: number;
  email: string;
  phone: string;
  dob: Date;
  enrollmentDate?: Date;
  address: Address;
  planId?: number;
  isActive: boolean;
}

interface Professional {
  id: number;
  specialty: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  address: Address;
  specialty?: Professional[];
}

interface Plan {
  id: number;
  name: string;
  durationMonths: number;
  price: number;
}

// Mocked Data
const clients: Client[] = [
  { 
    id: 1, 
    name: 'Marina Luz',
    cpf: 12312312377,
    rg: 10010110011,
    email: 'marina@example.com', 
    phone: '5588981858741',
    dob: new Date('1996-02-09'),
    enrollmentDate: new Date('2023-01-10'), 
    address: {  id: 1, street: 'Rua do amor', city: 'Icapuí', neighborhood: 'Centro', number: '950'},
    planId: 1,
    isActive: true,
  },
  { 
    id: 1, 
    name: 'Samara Everton',
    cpf: 12312312371,
    rg: 10010110012,
    email: 'samara@example.com', 
    phone: '558881588013',
    dob: new Date('1993-15-10'),
    enrollmentDate: new Date('2023-01-10'), 
    address: {  id: 2, street: 'Rua do amor', city: 'Icapuí', neighborhood: 'Centro', number: '950'},
    planId: 1,
    isActive: true,
  },
];

const employees: Employee[] = [
  { 
    id: 1, 
    name: 'Samuel Constantino', 
    email: 'carlos.roberto@example.com', 
    phone: '5588981858742', 
    isAdmin: true,
    address: {id: 3, street: 'Rua do amor', city: 'Icapuí', neighborhood: 'Centro', number: '950'},
    specialty: [{id: 1, specialty: 'Personal Trainer'}], 
  },
];

const plans: Plan[] = [
  { id: 1, name: 'Mensal', durationMonths: 1, price: 150 },
  { id: 2, name: 'Trimestral', durationMonths: 3, price: 400 },
  { id: 3, name: 'Anual', durationMonths: 12, price: 1500 },
];

const academyAddress: Address = {
  id: 4,
  city: 'Icapuí',
  neighborhood: 'Centro',
  number: 's/n',
  street: 'Rua da academia',
}

const equipments: string[] = [
  'Esteira', 
  'Alteres', 
  'Leg Press', 
  'Polias', 
  'Extensoras',
  'Flexoras',
];

const addresses = [];

const hours: string[] = [
  'De segunda à sexta: 5am à 21pm',
  'Sábado: 9am à 13pm',
];

// Middleware para verificar o header x-channel
app.use((req, res, next) => {
  const channel = req.headers['x-channel'];
  if (!channel) {
    return res.status(400).json({ error: 'x-channel header is required' });
  }
  next();
});

// Public Routes

app.get('/info', (req: Request, res: Response) => {
  const info: PublicInfo = {
    location: academyAddress,
    equipments,
    hours,
    plans
  };

  res.json(info);
});

app.put('/user', (req: Request, res: Response) => {
  const owner = req.headers['x-channel'] as string;
  const phone = owner.split('@')[0]

  const { name, email, cpf, rg, dob, address } = req.body;

  const employee = employees.find(employee => employee.phone === phone)
  if(employee) {
      return res.json(employee);
  }

  let client = clients.find(client => client.phone === phone)
  if(client) {
      if(name) client.name = name
      if(email) client.email = email
      clients[clients.findIndex(s => s.id === client?.id)] = client
      return res.json(client);
  }

  client = {
    id: clients.length + 1,
    name,
    cpf,
    rg,
    email,
    phone,
    dob,
    address: {
      id: addresses.length+1, 
      street: address?.street, 
      city: address?.city, 
      neighborhood: address?.neighborhood, 
      number: address?.number
    },
    isActive: false,
  };

  clients.push(client);
  res.status(201).json(client);
});

app.post('/user/subscribe', (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  const { planId } = req.body;

  const owner = req.headers['x-channel'] as string;
  const phone = owner.split('@')[0]

  const client = clients.find(client => client.phone === phone)
  
  if(!client) {
    return res.status(400).json({ message: 'client not found' });
  }

  const selectedPlan = plans.find(plan => plan.id === planId);

  if (!selectedPlan) {
    return res.status(400).json({ message: 'Invalid plan selected' });
  }

  client.planId = selectedPlan.id
  client.enrollmentDate = new Date()
  
  clients[clients.findIndex(c => c.id === client.id)] = client

  res.json({ message: 'Registration successful!', data: client });
});

// Administration Routes
app.use('/admin', (req: Request, res: Response, next: NextFunction) => {
  const owner = req.headers['x-channel'] as string;
  const phone = owner.split('@')[0];

  if(!employees.find(employee => employee.phone === phone && employee.isAdmin)) return res.status(403).json({ message: 'Access denied' });
  next()
});

app.get('/admin/clients', (_req: Request, res: Response) => {
  res.json({ clients });
});

app.get('/admin/employees', (_req: Request, res: Response) => {
  res.json({ employees });
});

app.get('/admin/plans', (_req: Request, res: Response) => {
  const plansWithClients = plans.map(plan => {
    const clientsWithPlan = clients.filter(client => client.planId === plan.id);
    return { ...plan, clients: clientsWithPlan };
  });

  res.json({ plans: plansWithClients });
});

app.get('/admin/subscriptions', (req: Request, res: Response) => {
  res.json({ subscriptions: clients.filter(client => client.planId) });
});

app.get('/admin/report', (_req: Request, res: Response) => {
  res.json({ 
    totalClients: clients.length,
    totalEmployees: employees.length,
    totalActiveClients: clients.filter(client => client.planId).length,
    totalMonthlyActiveClients: clients.filter(client => client.planId === 1).length,
    totalQuarterlyActiveClients: clients.filter(client => client.planId === 2).length,
    totalAnnualActiveClients: clients.filter(client => client.planId === 3).length,
    revenue: clients
      .filter(client => client.planId).
      reduce((acc, client) => {
        let plan = plans.find((p) => client.planId === p.id);
        return acc + (plan?.price || 0)
      }, 0)
  });
});

// Start the server
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});