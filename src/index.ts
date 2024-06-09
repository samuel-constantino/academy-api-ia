// @deno-types="npm:@types/express@4"
import express, { Request, Response, NextFunction } from 'npm:express@4.18.2';
import cors from "npm:cors";

import {validateCPF} from "../utils/validations.ts";

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

interface Lead {
  id: number;
  phone: string;
}

interface RegisterRequest {
  leadId: number;
  planId: number;
}

interface Address {
  street: string;
  city: string;
  neighborhood: string;
  number: string;
}

interface ClientAddress extends Address {
  clientId: number;
}

interface Client {
  id: number;
  name: string;
  cpf: string;
  rg: string;
  email?: string;
  phone: string;
  dob: Date;
  enrollmentDate?: Date;
  address: ClientAddress;
  planId: number;
  isActive: boolean;
  isBlocked: boolean;
}

interface Professional {
  id: number;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  address: Address;
  specialty?: string[];
}

interface Plan {
  id: number;
  name: string;
  durationMonths: number;
  price: number;
}

// Mocked Data
let leads: Lead[] = [];

const clients: Client[] = [
  { 
    id: 1, 
    name: 'Marina Luz',
    cpf: '12312312377',
    rg: '10010110011',
    email: 'marina@example.com', 
    phone: '5588981858741',
    dob: new Date('1996-02-09'),
    enrollmentDate: new Date('2023-01-10'), 
    address: {  clientId: 1, street: 'Rua do amor', city: 'Icapuí', neighborhood: 'Centro', number: '950'},
    planId: 1,
    isActive: false,
    isBlocked: true,
  },
  { 
    id: 2, 
    name: 'Samara Everton',
    cpf: '12312312371',
    rg: '10010110012',
    email: 'samara@example.com', 
    phone: '558881588013',
    dob: new Date('1993-15-10'),
    enrollmentDate: new Date('2023-01-10'), 
    address: {  clientId: 2, street: 'Rua do amor', city: 'Icapuí', neighborhood: 'Centro', number: '950'},
    planId: 1,
    isActive: true,
    isBlocked: false,
  },
];

const professionals: Professional[] = [
  { 
    id: 1, 
    name: 'Samuel Constantino', 
    email: 'carlos.roberto@example.com', 
    phone: '5588981858742', 
    isAdmin: true,
    address: {street: 'Rua do amor', city: 'Icapuí', neighborhood: 'Centro', number: '950'},
    specialty: ['Personal Trainer'], 
  },
];

const plans: Plan[] = [
  { id: 1, name: 'Mensal', durationMonths: 1, price: 100 },
  { id: 2, name: 'Trimestral', durationMonths: 3, price: 250 },
  { id: 3, name: 'Anual', durationMonths: 12, price: 1000 },
];

const academyAddress: Address = {
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

const addresses: ClientAddress[] = [];

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

app.post('/user', (req: Request, res: Response) => {
  const owner = req.headers['x-channel'] as string;
  const phone = owner.split('@')[0];

  const professional = professionals.find(p => p.phone === phone)
  if(professional) {
      return res.json(professional);
  }

  const client = clients.find(client => client.phone === phone)
  if(client) {
      return res.json(client);
  }

  const lead: Lead = {
    id: leads.length + 1,
    phone,
  };

  leads.push(lead);
  res.status(201).json(lead);
});

app.post('/user/subscribe', (req: Request<{}, {}, RegisterRequest>, res: Response) => {
  const { name, email, cpf, rg, dob, address, planId } = req.body;

  const owner = req.headers['x-channel'] as string;
  const phone = owner.split('@')[0]

  const selectedPlan = plans.find(plan => plan.id === planId);

  if (!selectedPlan) {
    return res.status(400).json({ message: 'Invalid plan selected' });
  }

  if(!validateCPF(cpf)) {
    return res.status(400).json({message: 'Invalid CPF'});
  }

  if(clients.find((c) => c.cpf === cpf.replace(/\D/g, ''))) {
    return res.status(400).json({message: 'There is already a registered customer with this CPF'});
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!email || !emailRegex.test(email)) {
    return res.status(400).json({message: 'Invalid E-mail'});
  }

  let client: Client = {
    id: clients.length+1,
    name,
    cpf: cpf.replace(/\D/g, ''),
    rg,
    email,
    phone,
    dob,
    enrollmentDate: new Date(),
    address,
    planId: selectedPlan.id,
    isActive: false,
    isBlocked: false,
  };

  // clients.push(client);

  const lead = leads.find(lead => lead.phone === phone)
  if(lead) {
    leads = leads.filter((l) => l.phone !== lead.phone);
  }
  
  res.json({ message: 'Registration successful!', data: client });
});

// Administration Routes
app.use('/admin', (req: Request, res: Response, next: NextFunction) => {
  const owner = req.headers['x-channel'] as string;
  const phone = owner.split('@')[0];

  if(!professionals.find(professional => professional.phone === phone && professional.isAdmin)) return res.status(403).json({ message: 'Access denied' });
  next()
});

app.get('/admin/leads', (_req: Request, res: Response) => {
  res.json({ leads });
});

app.get('/admin/clients', (_req: Request, res: Response) => {
  res.json({ clients });
});

app.get('/admin/professionals', (_req: Request, res: Response) => {
  res.json({ professionals });
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
    totalProfessionals: professionals.length,
    totalActiveClients: clients.filter(client => client.planId).length,
    totalMonthlyActiveClients: clients.filter(client => client.planId === 1).length,
    totalQuarterlyActiveClients: clients.filter(client => client.planId === 2).length,
    totalAnnualActiveClients: clients.filter(client => client.planId === 3).length,
    revenue: clients
      .filter(client => client.planId)
      .reduce((acc, client) => {
        let plan = plans.find((p) => client.planId === p.id);
        return acc + (plan?.price || 0)
      }, 0)
  });
});

// Start the server
app.listen(Deno.env.get("PORT") || 3000, () => {
  console.log(`Server is running on port ${Deno.env.get("PORT") || 3000}`);
});