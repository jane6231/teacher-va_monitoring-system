'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type VATask = {
  id: string;
  title: string;
  description: string | null;
  client_name: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
};


type VAProject = {
  id: string;
  user_id: string;
  project_name: string;
  client_name: string | null;
  description: string | null;
  status: 'active' | 'completed' | 'on_hold';
  start_date: string | null;
  due_date: string | null;
  retainer_amount: number;
  billing_cycle: string;
  created_at: string;
  updated_at: string;
};


type VATimeEntry = {
  id: string;
  user_id: string;
  task_id: string | null;
  client_name: string | null;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  hourly_rate: number;
  is_billable: boolean;
  created_at: string;
};

type VAInvoice = {
  id: string;
  user_id: string;
  invoice_number: string;
  client_name: string;
  description: string | null;
  amount: number;
  issue_date: string;
  due_date: string | null;
  status: 'pending' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;
};


type VABIRAdjustment = {
  id: string;
  user_id: string;
  tax_year: number;
  income_date: string;
  description: string;
  amount: number;
  source: string | null;
  document_url: string | null;
  created_at: string;
};

type VADocument = {
  id: string;
  user_id: string;
  document_name: string;
  category: string;
  tax_year: number;
  reporting_period: string | null;
  filing_status: string;
  document_url: string;
  document_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};


const formatPeso = (value: number | string | null | undefined) => {
  const amount = Number(value ?? 0);

  return `₱${(Number.isFinite(amount) ? amount : 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function VADashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('charcoal');
  const [tasks, setTasks] = useState<VATask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskStatus, setTaskStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');

const [projects, setProjects] = useState<VAProject[]>([]);
const [projectsLoading, setProjectsLoading] = useState(false);
const [projectError, setProjectError] = useState('');
const [showProjectForm, setShowProjectForm] = useState(false);
const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

const [projectName, setProjectName] = useState('');
const [projectClient, setProjectClient] = useState('');
const [projectDescription, setProjectDescription] = useState('');
const [projectStatus, setProjectStatus] = useState<VAProject['status']>('active');
const [projectStartDate, setProjectStartDate] = useState('');
const [projectDueDate, setProjectDueDate] = useState('');
const [retainerAmount, setRetainerAmount] = useState('0');
const [billingCycle, setBillingCycle] = useState('monthly');

const [timeEntries, setTimeEntries] = useState<VATimeEntry[]>([]);
const [timeLoading, setTimeLoading] = useState(false);
const [activeTimer, setActiveTimer] = useState<VATimeEntry | null>(null);
const [elapsedSeconds, setElapsedSeconds] = useState(0);
const [timerDescription, setTimerDescription] = useState('');
const [timerClientName, setTimerClientName] = useState('');
const [hourlyRate, setHourlyRate] = useState('600');
const [showTimerForm, setShowTimerForm] = useState(false);
const [timeError, setTimeError] = useState('');
const [invoices, setInvoices] = useState<VAInvoice[]>([]);
const [invoicesLoading, setInvoicesLoading] = useState(false);
const [invoiceError, setInvoiceError] = useState('');
const [showInvoiceForm, setShowInvoiceForm] = useState(false);
const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
const [viewingInvoice, setViewingInvoice] = useState<VAInvoice | null>(null);

const [invoiceClient, setInvoiceClient] = useState('');
const [invoiceDescription, setInvoiceDescription] = useState('');
const [invoiceAmount, setInvoiceAmount] = useState('');
const [invoiceIssueDate, setInvoiceIssueDate] = useState('');
const [invoiceDueDate, setInvoiceDueDate] = useState('');
const [invoiceStatus, setInvoiceStatus] = useState<VAInvoice['status']>('pending');
useEffect(() => {
  setInvoiceIssueDate(new Date().toISOString().split('T')[0]);
}, []);

const [documents, setDocuments] = useState<VADocument[]>([]);
const [documentsLoading, setDocumentsLoading] = useState(false);
const [documentError, setDocumentError] = useState('');
const [showDocumentForm, setShowDocumentForm] = useState(false);
const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
const [selectedTaxYear, setSelectedTaxYear] = useState(0);
const [currentTaxYear, setCurrentTaxYear] = useState(0);
const [documentName, setDocumentName] = useState('');
const [documentCategory, setDocumentCategory] = useState('1701Q');
const [documentPeriod, setDocumentPeriod] = useState('Q1');
const [documentFilingStatus, setDocumentFilingStatus] = useState('Filed');
const [documentUrl, setDocumentUrl] = useState('');
const [documentDate, setDocumentDate] = useState('');
const [documentNotes, setDocumentNotes] = useState('');
const [documentSaving, setDocumentSaving] = useState(false);
const documentFormRef = useRef<HTMLFormElement | null>(null);

useEffect(() => {
  if (showDocumentForm) {
    documentFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}, [showDocumentForm, editingDocumentId]);
const [birAdjustments, setBirAdjustments] = useState<VABIRAdjustment[]>([]);
const [birAdjustmentsLoading, setBirAdjustmentsLoading] = useState(false);
const [birAdjustmentError, setBirAdjustmentError] = useState('');
const [showBirAdjustmentForm, setShowBirAdjustmentForm] = useState(false);
const [birIncomeDescription, setBirIncomeDescription] = useState('');
const [birIncomeDate, setBirIncomeDate] = useState('');
const [birIncomeAmount, setBirIncomeAmount] = useState('');
const [birIncomeSource, setBirIncomeSource] = useState('Other reportable income');
const [birIncomeDocumentUrl, setBirIncomeDocumentUrl] = useState('');
const [editingBirAdjustmentId, setEditingBirAdjustmentId] = useState<string | null>(null);
const [birAdjustmentSaving, setBirAdjustmentSaving] = useState(false);
const birIncomeFormRef = useRef<HTMLFormElement | null>(null);

useEffect(() => {
  if (showBirAdjustmentForm && editingBirAdjustmentId) {
    birIncomeFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}, [showBirAdjustmentForm, editingBirAdjustmentId]);

useEffect(() => {
  const year = new Date().getFullYear();
  setCurrentTaxYear(year);
  setSelectedTaxYear(year);
}, []);

const [reportMonth, setReportMonth] = useState('');
useEffect(() => {
  setReportMonth(new Date().toISOString().slice(0, 7));
}, []);

// Set the chart's reference date after mount to avoid a prerender-time Date mismatch.
const [chartReferenceDate, setChartReferenceDate] = useState<Date | null>(null);
useEffect(() => {
  setChartReferenceDate(new Date());
}, []);

  const router = useRouter();
  const supabase = createClient();

  async function loadTasks(userId: string) {
    setTasksLoading(true);
    setTaskError('');

    const { data, error } = await supabase
      .from('va_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      setTaskError(error.message);
      setTasks([]);
    } else {
      setTasks((data || []) as VATask[]);
    }

    setTasksLoading(false);
  }

async function loadProjects(userId: string) {
  setProjectsLoading(true);
  setProjectError('');

  const { data, error } = await supabase
    .from('va_projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    setProjectError(error.message);
    setProjects([]);
  } else {
    setProjects((data || []) as VAProject[]);
  }

  setProjectsLoading(false);
}

async function loadTimeEntries(userId: string) {
  setTimeLoading(true);
  setTimeError('');

  const { data, error } = await supabase
    .from('va_time_entries')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (error) {
    setTimeError(error.message);
    setTimeEntries([]);
  } else {
    const entries = (data || []) as VATimeEntry[];
    setTimeEntries(entries);
    setActiveTimer(entries.find(entry => !entry.ended_at) || null);
  }

  setTimeLoading(false);
}

async function loadBIRAdjustments(userId: string) {
  setBirAdjustmentsLoading(true);
  setBirAdjustmentError('');
  const { data, error } = await supabase
    .from('va_bir_income_adjustments')
    .select('*')
    .eq('user_id', userId)
    .order('income_date', { ascending: false });

  if (error) {
    setBirAdjustmentError(error.message);
    setBirAdjustments([]);
  } else {
    setBirAdjustments((data || []) as VABIRAdjustment[]);
  }
  setBirAdjustmentsLoading(false);
}

function resetBIRAdjustmentForm() {
  setEditingBirAdjustmentId(null);
  setBirIncomeDescription('');
  setBirIncomeAmount('');
  setBirIncomeDate('');
  setBirIncomeSource('Other reportable income');
  setBirIncomeDocumentUrl('');
  setBirAdjustmentError('');
  setShowBirAdjustmentForm(false);
}

function editBIRAdjustment(item: VABIRAdjustment) {
  setEditingBirAdjustmentId(item.id);
  setBirIncomeDescription(item.description);
  setBirIncomeAmount(Number(item.amount).toLocaleString('en-PH', { maximumFractionDigits: 2 }));
  setBirIncomeDate(item.income_date);
  setBirIncomeSource(item.source || 'Other reportable income');
  setBirIncomeDocumentUrl(item.document_url || '');
  setBirAdjustmentError('');
  setShowBirAdjustmentForm(true);
}

async function saveBIRAdjustment(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (!user?.id) return;
  const amount = Number(birIncomeAmount.replace(/,/g, ''));
  if (!birIncomeDescription.trim() || !birIncomeDate || !Number.isFinite(amount) || amount <= 0) {
    setBirAdjustmentError('Enter a description, date, and amount greater than zero.');
    return;
  }

  setBirAdjustmentSaving(true);
  setBirAdjustmentError('');
  const payload = {
    user_id: user.id,
    tax_year: Number(birIncomeDate.slice(0, 4)),
    income_date: birIncomeDate,
    description: birIncomeDescription.trim(),
    amount,
    source: birIncomeSource,
    document_url: birIncomeDocumentUrl.trim() || null,
  };

  const query = editingBirAdjustmentId
    ? supabase.from('va_bir_income_adjustments').update(payload)
        .eq('id', editingBirAdjustmentId).eq('user_id', user.id)
    : supabase.from('va_bir_income_adjustments').insert(payload);
  const { error } = await query;

  if (error) {
    setBirAdjustmentError(error.message);
  } else {
    resetBIRAdjustmentForm();
    await loadBIRAdjustments(user.id);
  }
  setBirAdjustmentSaving(false);
}

async function deleteBIRAdjustment(id: string) {
  if (!user?.id || !window.confirm('Delete this manual BIR income entry?')) return;
  const { error } = await supabase.from('va_bir_income_adjustments')
    .delete().eq('id', id).eq('user_id', user.id);
  if (error) setBirAdjustmentError(error.message);
  else await loadBIRAdjustments(user.id);
}

async function loadDocuments(userId: string) {
  setDocumentsLoading(true);
  setDocumentError('');

  const { data, error } = await supabase
    .from('va_documents')
    .select('*')
    .eq('user_id', userId)
    .order('tax_year', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    setDocumentError(error.message);
    setDocuments([]);
  } else {
    setDocuments((data || []) as VADocument[]);
  }

  setDocumentsLoading(false);
}

function resetDocumentForm() {
  setDocumentName('');
  setDocumentCategory('1701Q');
  setDocumentPeriod('Q1');
  setDocumentFilingStatus('Filed');
  setDocumentUrl('');
  setDocumentDate('');
  setDocumentNotes('');
  setEditingDocumentId(null);
  setShowDocumentForm(false);
}

function openNewDocumentForm() {
  setEditingDocumentId(null);
  setDocumentName('');
  setDocumentCategory('1701Q');
  setDocumentPeriod('Q1');
  setDocumentFilingStatus('Filed');
  setDocumentUrl('');
  setDocumentDate('');
  setDocumentNotes('');
  setShowDocumentForm(true);
}

function openEditDocumentForm(document: VADocument) {
  setEditingDocumentId(document.id);
  setDocumentName(document.document_name);
  setDocumentCategory(document.category);
  setDocumentPeriod(document.reporting_period || 'N/A');
  setDocumentFilingStatus(document.filing_status || 'Filed');
  setDocumentUrl(document.document_url);
  setDocumentDate(document.document_date || '');
  setDocumentNotes(document.notes || '');
  setSelectedTaxYear(document.tax_year);
  setShowDocumentForm(true);
}

async function saveDocument(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!user?.id) {
    setDocumentError('Please sign in again before saving a document.');
    return;
  }

  const normalizedUrl = documentUrl.trim();
  if (!/^https:\/\//i.test(normalizedUrl)) {
    setDocumentError('Please enter a secure link beginning with https://');
    return;
  }

  setDocumentSaving(true);
  setDocumentError('');

  const payload = {
    user_id: user.id,
    document_name: documentName.trim(),
    category: documentCategory,
    tax_year: selectedTaxYear,
    reporting_period: documentPeriod || null,
    filing_status: documentFilingStatus,
    document_url: normalizedUrl,
    document_date: documentDate || null,
    notes: documentNotes.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const query = editingDocumentId
    ? supabase.from('va_documents').update(payload).eq('id', editingDocumentId).eq('user_id', user.id)
    : supabase.from('va_documents').insert(payload);

  const { error } = await query;

  if (error) {
    setDocumentError(error.message);
    setDocumentSaving(false);
    return;
  }

  await loadDocuments(user.id);
  setDocumentSaving(false);
  resetDocumentForm();
}

async function deleteDocument(documentId: string) {
  if (!user?.id || !window.confirm('Delete this document record? The external file itself will not be deleted.')) {
    return;
  }

  const { error } = await supabase
    .from('va_documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', user.id);

  if (error) {
    setDocumentError(error.message);
    return;
  }

  await loadDocuments(user.id);
}

  useEffect(() => {
    const savedTheme = localStorage.getItem('va_dashboard_theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }

    async function loadInvoices(userId: string) {
  setInvoicesLoading(true);
  setInvoiceError('');

  const { data, error } = await supabase
    .from('va_invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    setInvoiceError(error.message);
    setInvoices([]);
  } else {
    setInvoices((data || []) as VAInvoice[]);
  }

  setInvoicesLoading(false);
}
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);
await loadTasks(user.id);
await loadTimeEntries(user.id);
await loadProjects(user.id);
await loadInvoices(user.id);
await loadDocuments(user.id);
await loadBIRAdjustments(user.id);
      setLoading(false);
    }
    getUser();
  }, [router, supabase]);


useEffect(() => {
  if (!activeTimer) {
    setElapsedSeconds(0);
    return;
  }

  const updateElapsed = () => {
    const seconds = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(activeTimer.started_at).getTime()) / 1000
      )
    );

    setElapsedSeconds(seconds);
  };

  updateElapsed();

  const interval = window.setInterval(updateElapsed, 1000);
  return () => window.clearInterval(interval);
}, [activeTimer]);

const monthlyRevenueData = chartReferenceDate
  ? Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        chartReferenceDate.getFullYear(),
        chartReferenceDate.getMonth(),
        1
      );
      date.setMonth(date.getMonth() - (5 - index));

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;

      const revenue = timeEntries
        .filter(entry =>
          entry.started_at?.slice(0, 7) === monthKey && entry.is_billable
        )
        .reduce(
          (total, entry) =>
            total +
            ((Number(entry.duration_seconds) || 0) / 3600) *
              (Number(entry.hourly_rate) || 0),
          0
        );

      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue,
      };
    })
  : [];

const maxMonthlyRevenue = Math.max(
  ...monthlyRevenueData.map(item => item.revenue),
  1
);

const clientWiseEarnings = Object.values(
  timeEntries.reduce((groups, entry) => {
    const client = entry.client_name?.trim() || 'Unassigned Client';

    if (!groups[client]) {
      groups[client] = {
        client,
        totalSeconds: 0,
        totalEarnings: 0,
      };
    }

    groups[client].totalSeconds +=
      Number(entry.duration_seconds) || 0;

    if (entry.is_billable) {
      groups[client].totalEarnings +=
        ((Number(entry.duration_seconds) || 0) / 3600) *
        (Number(entry.hourly_rate) || 0);
    }

    return groups;
  }, {} as Record<string, {
    client: string;
    totalSeconds: number;
    totalEarnings: number;
  }>)
).sort((a, b) => b.totalEarnings - a.totalEarnings);

const totalClientEarnings = clientWiseEarnings.reduce(
  (total, item) => total + item.totalEarnings,
  0
);
  const birYearInvoices = invoices.filter(invoice =>
    invoice.status === 'paid' && invoice.issue_date?.slice(0, 4) === String(selectedTaxYear)
  );
  const birYearAdjustments = birAdjustments.filter(item => item.tax_year === selectedTaxYear);
  const birInvoiceIncome = birYearInvoices.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
  const birManualIncome = birYearAdjustments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const birGrossIncome = birInvoiceIncome + birManualIncome;
  const birEightPercentTaxBase = Math.max(0, birGrossIncome - 250000);
  const birEstimatedTax = birEightPercentTaxBase * 0.08;
  const birQuarterTotals = [1, 2, 3, 4].map(q => {
    const invoiceTotal = birYearInvoices.filter(inv => {
      const month = Number(inv.issue_date.slice(5, 7));
      return Math.ceil(month / 3) === q;
    }).reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const manualTotal = birYearAdjustments.filter(item => Math.ceil(Number(item.income_date.slice(5, 7)) / 3) === q)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    return invoiceTotal + manualTotal;
  });

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('va_dashboard_theme', newTheme);
  };

  const resetTaskForm = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskDescription('');
    setClientName('');
    setDueDate('');
    setPriority('medium');
    setTaskStatus('pending');
    setShowTaskForm(false);
  };

  const openNewTaskForm = () => {
    resetTaskForm();
    setShowTaskForm(true);
  };

  const openEditTaskForm = (task: VATask) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setClientName(task.client_name || '');
    setDueDate(task.due_date || '');
    setPriority(task.priority);
    setTaskStatus(task.status);
    setShowTaskForm(true);
  };

  const handleSaveTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setTaskError('');

    const taskData = {
      title: taskTitle.trim(),
      description: taskDescription.trim() || null,
      client_name: clientName.trim() || null,
      due_date: dueDate || null,
      priority,
      status: taskStatus,
      updated_at: new Date().toISOString(),
    };

    if (!taskData.title) {
      setTaskError('Please enter a task title.');
      return;
    }

    const result = editingTaskId
      ? await supabase
          .from('va_tasks')
          .update(taskData)
          .eq('id', editingTaskId)
          .eq('user_id', user.id)
      : await supabase
          .from('va_tasks')
          .insert({ ...taskData, user_id: user.id });

    if (result.error) {
      setTaskError(result.error.message);
      return;
    }

    await loadTasks(user.id);
    resetTaskForm();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user || !window.confirm('Delete this task? This cannot be undone.')) return;

    const { error } = await supabase
      .from('va_tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      setTaskError(error.message);
      return;
    }

    await loadTasks(user.id);
  };

  const handleTaskStatusChange = async (
    taskId: string,
    status: VATask['status']
  ) => {
    if (!user) return;

    const { error } = await supabase
      .from('va_tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      setTaskError(error.message);
      return;
    }

    await loadTasks(user.id);
  };


const handleStartTimer = async () => {
  if (!user) return;

  setTimeError('');

  if (activeTimer) {
    setTimeError('A timer is already running. Stop it before starting another.');
    return;
  }

  const { data, error } = await supabase
    .from('va_time_entries')
    .insert({
      user_id: user.id,
      client_name: timerClientName.trim() || null,
      description: timerDescription.trim() || null,
      started_at: new Date().toISOString(),
      hourly_rate: Number(hourlyRate) || 0,
      is_billable: true,
    })
    .select()
    .single();

  if (error) {
    setTimeError(error.message);
    return;
  }

  setActiveTimer(data as VATimeEntry);
  setTimeEntries(prev => [data as VATimeEntry, ...prev]);
  setShowTimerForm(false);
  setTimerDescription('');
  setTimerClientName('');
};

const handleStopTimer = async () => {
  if (!user || !activeTimer) return;

  setTimeError('');

  const endedAt = new Date();
  const duration = Math.max(
    0,
    Math.floor(
      (endedAt.getTime() -
        new Date(activeTimer.started_at).getTime()) / 1000
    )
  );

  const { data, error } = await supabase
    .from('va_time_entries')
    .update({
      ended_at: endedAt.toISOString(),
      duration_seconds: duration,
    })
    .eq('id', activeTimer.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    setTimeError(error.message);
    return;
  }

  setTimeEntries(prev =>
    prev.map(entry => entry.id === activeTimer.id
      ? data as VATimeEntry
      : entry
    )
  );

  setActiveTimer(null);
  setElapsedSeconds(0);
};

const handleDeleteTimeEntry = async (entryId: string) => {
  if (!user || !window.confirm('Delete this time entry? This cannot be undone.')) return;
  setTimeError('');
  const { error } = await supabase.from('va_time_entries')
    .delete().eq('id', entryId).eq('user_id', user.id);
  if (error) {
    setTimeError(error.message);
    return;
  }
  setTimeEntries(prev => prev.filter(entry => entry.id !== entryId));
  if (activeTimer?.id === entryId) {
    setActiveTimer(null);
    setElapsedSeconds(0);
  }
};


const resetProjectForm = () => {
  setEditingProjectId(null);
  setProjectName('');
  setProjectClient('');
  setProjectDescription('');
  setProjectStatus('active');
  setProjectStartDate('');
  setProjectDueDate('');
  setRetainerAmount('0');
  setBillingCycle('monthly');
  setShowProjectForm(false);
  setProjectError('');
};

const openNewProjectForm = () => {
  resetProjectForm();
  setShowProjectForm(true);
};

const openEditProjectForm = (project: VAProject) => {
  setEditingProjectId(project.id);
  setProjectName(project.project_name);
  setProjectClient(project.client_name || '');
  setProjectDescription(project.description || '');
  setProjectStatus(project.status);
  setProjectStartDate(project.start_date || '');
  setProjectDueDate(project.due_date || '');
  setRetainerAmount(String(project.retainer_amount ?? 0));
  setBillingCycle(project.billing_cycle || 'monthly');
  setProjectError('');
  setShowProjectForm(true);
};

const handleSaveProject = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  if (!user) return;

  setProjectError('');

  if (!projectName.trim()) {
    setProjectError('Please enter a project name.');
    return;
  }

  const amount = Number(retainerAmount);

  if (!Number.isFinite(amount) || amount < 0) {
    setProjectError('Please enter a valid project budget.');
    return;
  }

  if (
    projectStartDate &&
    projectDueDate &&
    projectDueDate < projectStartDate
  ) {
    setProjectError('Deadline cannot be earlier than the start date.');
    return;
  }

  const projectData = {
    project_name: projectName.trim(),
    client_name: projectClient.trim() || null,
    description: projectDescription.trim() || null,
    status: projectStatus,
    start_date: projectStartDate || null,
    due_date: projectDueDate || null,
    retainer_amount: amount,
    billing_cycle: billingCycle,
    updated_at: new Date().toISOString(),
  };

  const result = editingProjectId
    ? await supabase
        .from('va_projects')
        .update(projectData)
        .eq('id', editingProjectId)
        .eq('user_id', user.id)
    : await supabase
        .from('va_projects')
        .insert({
          ...projectData,
          user_id: user.id,
        });

  if (result.error) {
    setProjectError(result.error.message);
    return;
  }

  await loadProjects(user.id);
  resetProjectForm();
};

const handleDeleteProject = async (projectId: string) => {
  if (
    !user ||
    !window.confirm('Delete this project? This cannot be undone.')
  ) return;

  const { error } = await supabase
    .from('va_projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id);

  if (error) {
    setProjectError(error.message);
    return;
  }

  await loadProjects(user.id);
};
const resetInvoiceForm = () => {
  setEditingInvoiceId(null);
  setInvoiceClient('');
  setInvoiceDescription('');
  setInvoiceAmount('');
  setInvoiceIssueDate(new Date().toISOString().split('T')[0]);
  setInvoiceDueDate('');
  setInvoiceStatus('pending');
  setShowInvoiceForm(false);
  setInvoiceError('');
};


const openEditInvoiceForm = (invoice: VAInvoice) => {
  setEditingInvoiceId(invoice.id);

  setInvoiceClient(invoice.client_name);
  setInvoiceDescription(invoice.description || '');
  setInvoiceAmount(String(invoice.amount));
  setInvoiceIssueDate(invoice.issue_date);
  setInvoiceDueDate(invoice.due_date || '');
  setInvoiceStatus(invoice.status);

  setInvoiceError('');
  setShowInvoiceForm(true);
};


const handleSaveInvoice = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  if (!user) return;

  setInvoiceError('');

  const amount = Number(invoiceAmount);

  if (!invoiceClient.trim()) {
    setInvoiceError('Please enter a client name.');
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    setInvoiceError('Please enter a valid invoice amount.');
    return;
  }

  if (!invoiceIssueDate) {
    setInvoiceError('Please select an issue date.');
    return;
  }

  const invoiceData = {
    client_name: invoiceClient.trim(),
    description: invoiceDescription.trim() || null,
    amount,
    issue_date: invoiceIssueDate,
    due_date: invoiceDueDate || null,
    status: invoiceStatus,
    updated_at: new Date().toISOString(),
  };

  if (editingInvoiceId) {
    const { data, error } = await supabase
      .from('va_invoices')
      .update(invoiceData)
      .eq('id', editingInvoiceId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      setInvoiceError(error.message);
      return;
    }

    setInvoices(prev =>
      prev.map(invoice =>
        invoice.id === editingInvoiceId
          ? data as VAInvoice
          : invoice
      )
    );
  } else {
    const { data, error } = await supabase
      .from('va_invoices')
      .insert({
        ...invoiceData,
        user_id: user.id,
        invoice_number: `INV-${Date.now()}`,
      })
      .select()
      .single();

    if (error) {
      setInvoiceError(error.message);
      return;
    }

    setInvoices(prev => [data as VAInvoice, ...prev]);
  }

  resetInvoiceForm();
};

const handleDeleteInvoice = async (invoiceId: string) => {
  if (!user || !window.confirm('Delete this invoice? This cannot be undone.')) return;
  setInvoiceError('');
  const { error } = await supabase.from('va_invoices')
    .delete().eq('id', invoiceId).eq('user_id', user.id);
  if (error) {
    setInvoiceError(error.message);
    return;
  }
  setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
  if (viewingInvoice?.id === invoiceId) setViewingInvoice(null);
};


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/sign-up');
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-neutral-100 text-neutral-800 font-medium">Loading VA portal...</div>;
  }

  // 5 Theme Options including Pink & Colorful
  const themes: any = {
    charcoal: {
      bgMain: 'bg-[#FAFAFA]',
      sidebar: 'bg-neutral-900 text-neutral-100 border-neutral-800',
      brandBox: 'bg-neutral-800 border-neutral-700',
      brandIcon: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      navActive: 'bg-amber-600 text-white shadow-md',
      navInactive: 'text-neutral-300 hover:bg-neutral-800 hover:text-white',
      accentBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
      cardBg: 'bg-white',
      cardBorder: 'border-neutral-200',
      textMuted: 'text-neutral-500',
      currencyColor: 'text-amber-600',
    },
    teal: {
      bgMain: 'bg-[#F4FBFB]',
      sidebar: 'bg-teal-950 text-teal-100 border-teal-900',
      brandBox: 'bg-teal-900 border-teal-800',
      brandIcon: 'bg-teal-800 text-teal-200',
      navActive: 'bg-teal-600 text-white shadow-md',
      navInactive: 'text-teal-200 hover:bg-teal-900 hover:text-white',
      accentBtn: 'bg-teal-600 hover:bg-teal-700 text-white',
      cardBg: 'bg-white',
      cardBorder: 'border-teal-100',
      textMuted: 'text-teal-700',
      currencyColor: 'text-teal-700',
    },
    indigo: {
      bgMain: 'bg-slate-50',
      sidebar: 'bg-slate-900 text-slate-100 border-slate-800',
      brandBox: 'bg-slate-800 border-slate-700',
      brandIcon: 'bg-indigo-600 text-white',
      navActive: 'bg-indigo-600 text-white shadow-md',
      navInactive: 'text-slate-300 hover:bg-slate-800 hover:text-white',
      accentBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      cardBg: 'bg-white',
      cardBorder: 'border-slate-200',
      textMuted: 'text-slate-500',
      currencyColor: 'text-indigo-600',
    },
    pink: {
      bgMain: 'bg-[#FFF5F7]',
      sidebar: 'bg-[#700F37] text-white border-[#8A1344]',
      brandBox: 'bg-[#8A1344] border-[#A21952]',
      brandIcon: 'bg-amber-300 text-neutral-900',
      navActive: 'bg-[#FF2E7E] text-white shadow-md',
      navInactive: 'text-pink-100 hover:bg-[#8A1344]',
      accentBtn: 'bg-[#FF2E7E] hover:bg-[#e0226e] text-white',
      cardBg: 'bg-white',
      cardBorder: 'border-pink-100',
      textMuted: 'text-pink-700',
      currencyColor: 'text-[#FF2E7E]',
    },
    colorful: {
      bgMain: 'bg-gradient-to-br from-pink-50/60 via-purple-50/60 to-indigo-50/60',
      sidebar: 'bg-gradient-to-b from-purple-950 via-indigo-950 to-pink-950 text-white border-purple-900',
      brandBox: 'bg-white/10 border-white/20 backdrop-blur-sm',
      brandIcon: 'bg-gradient-to-r from-amber-400 to-pink-500 text-white shadow-md',
      navActive: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md',
      navInactive: 'text-purple-200 hover:bg-white/10 hover:text-white',
      accentBtn: 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-md',
      cardBg: 'bg-white/90 backdrop-blur-sm',
      cardBorder: 'border-purple-100',
      textMuted: 'text-purple-700',
      currencyColor: 'text-pink-600',
    }
  };

  const t = themes[theme] || themes.charcoal;

  const calendarDays = [
    ...Array(3).fill(null),
    ...Array.from({ length: 31 }, (_, i) => i + 1)
  ];

  return (
    <div className={`flex min-h-screen w-full max-w-full overflow-x-hidden ${t.bgMain} text-neutral-900 transition-colors duration-300`}>
      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <button type="button" aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-30 bg-black/50 lg:hidden" />
      )}

      {/* Sidebar: permanent on desktop, slide-out menu on phones */}
      <aside className={`w-72 max-w-[85vw] lg:w-64 ${t.sidebar} flex flex-col justify-between p-5 sm:p-6 shadow-md fixed inset-y-0 left-0 z-40 border-r overflow-y-auto transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div>
          <div className="mb-4 flex justify-end lg:hidden">
            <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="rounded-lg px-3 py-2 text-xl hover:bg-white/10">✕</button>
          </div>
          <div className={`flex items-center gap-3 mb-8 ${t.brandBox} p-3 rounded-xl border`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner ${t.brandIcon}`}>
              {theme === 'charcoal' ? '💼' : theme === 'teal' ? '🚀' : theme === 'indigo' ? '⚡' : theme === 'pink' ? '🌸' : '🌈'}
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white">VA & Freelance</h2>
              <p className="text-xs opacity-75">Management System</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'dashboard' ? t.navActive : t.navInactive}`}>📊 My Dashboard</button>
            <button onClick={() => { setActiveTab('tasks'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'tasks' ? t.navActive : t.navInactive}`}>📋 Client Tasks</button>
            <button onClick={() => { setActiveTab('tracker'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'tracker' ? t.navActive : t.navInactive}`}>⏱️ Time Tracker</button>
            <button onClick={() => { setActiveTab('projects'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'projects' ? t.navActive : t.navInactive}`}>📁 Projects</button>
            <button onClick={() => { setActiveTab('invoices'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'invoices' ? t.navActive : t.navInactive}`}>💳 Invoices & Billing</button>
            <button onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'reports' ? t.navActive : t.navInactive}`}>📈 Reports</button>
            <button onClick={() => { setActiveTab('documents'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'documents' ? t.navActive : t.navInactive}`}>🧾 BIR Tax Center</button>
          <button
  onClick={() => { setMobileMenuOpen(false); router.push('/teacher-dashboard'); }}
  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${t.navInactive}`}
>
  🎓 Switch to Teacher Dashboard
</button>
          </nav>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-2 opacity-75 hover:opacity-100 px-4 py-2 text-sm font-medium transition mt-auto border-t border-current/20 pt-4">🚪 Sign Out</button>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 w-full flex-1 ml-0 px-4 py-4 pb-8 sm:px-6 sm:py-6 lg:ml-64 lg:p-8 overflow-x-hidden">
        {/* Compact phone header */}
        <div className="sticky top-0 z-20 -mx-4 -mt-4 mb-5 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6 lg:hidden">
          <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation menu" className="rounded-xl border border-neutral-200 px-3 py-2 text-lg text-neutral-800 shadow-sm">☰</button>
          <div className="min-w-0 px-3 text-center">
            <p className="truncate text-sm font-bold text-neutral-900">VA & Freelance</p>
            <p className="text-[11px] text-neutral-500">Management System</p>
          </div>
          <button type="button" onClick={handleLogout} className="rounded-xl px-2 py-2 text-xs font-semibold text-neutral-600">Sign Out</button>
        </div>
        {activeTab === 'dashboard' && (
          <>
            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8`}>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 flex items-center gap-2">Virtual Assistant Dashboard 🚀</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Manage your active client tasks, logged hours, and billing</p>
              </div>
              <div className="flex w-full flex-wrap items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-100/80 p-1.5 text-xs font-medium sm:w-auto sm:gap-2 sm:text-sm">
                <button className="rounded-lg px-2.5 py-2 text-neutral-600 transition hover:bg-white sm:px-3 sm:py-1.5">Today</button>
                <button className="rounded-lg px-2.5 py-2 text-neutral-600 transition hover:bg-white sm:px-3 sm:py-1.5">This Week</button>
                <button className={`rounded-lg px-2.5 py-2 text-white shadow-xs sm:px-3 sm:py-1.5 ${t.accentBtn}`}>This Month</button>
                <button className="rounded-lg px-2.5 py-2 text-neutral-600 transition hover:bg-white sm:px-3 sm:py-1.5">This Year</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder} relative`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>ACTIVE CLIENTS</span><p className="text-3xl font-black text-neutral-900 mt-3">0</p><p className="text-xs text-neutral-500 font-medium mt-1">Clients</p></div>
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>TASKS DUE TODAY</span><p className="text-3xl font-black text-neutral-900 mt-3">0</p><p className="text-xs text-neutral-500 font-medium mt-1">Pending items</p></div>
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>LOGGED HOURS</span><p className="text-3xl font-black text-neutral-900 mt-3">0.0</p><p className="text-xs text-neutral-500 font-medium mt-1">Hours</p></div>
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>REVENUE & INVOICES</span><p className={`text-2xl font-black ${t.currencyColor} mt-3`}>{formatPeso(
  timeEntries.reduce(
    (total, entry) =>
      total +
      (entry.is_billable
        ? ((entry.duration_seconds || 0) / 3600) *
          (Number(entry.hourly_rate) || 0)
        : 0),
    0
  )
)}</p><p className="text-xs text-neutral-500 font-medium mt-1">0 invoices paid</p></div>
            </div>

            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} mb-8`}>
              <h2 className="text-base font-bold text-neutral-900 mb-4">📋 Tasks & Schedule for Today</h2>
              <div className="p-8 text-center bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl"><p className="text-sm font-medium text-neutral-500">No tasks scheduled for today yet.</p></div>
            </div>

            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
              <h2 className="text-xl font-black text-neutral-900 mb-6">October 2026</h2>
              <div className={`grid grid-cols-7 text-center font-bold text-xs ${t.textMuted} py-3 border-b border-neutral-100`}><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-4">
                {calendarDays.map((day, index) => (
                  <div key={index} className={`h-24 p-2 border rounded-xl flex flex-col justify-between ${day ? `${t.cardBorder}${t.cardBg} shadow-xs` : 'border-neutral-100 bg-neutral-50/40'}`}>
                    {day && <span className="text-xs font-bold text-neutral-700">{day}</span>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'tasks' && (
          <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-black text-neutral-900">📋 Client Tasks</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Track daily task lists, deadlines, and priorities</p>
              </div>
              <button
                onClick={openNewTaskForm}
                className={`px-4 py-2 ${t.accentBtn} rounded-xl text-sm font-bold shadow-xs transition`}
              >
                + Add Task
              </button>
            </div>

            {taskError && (
              <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {taskError}
              </div>
            )}

            {showTaskForm && (
              <form onSubmit={handleSaveTask} className="mb-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-neutral-900">{editingTaskId ? 'Edit Task' : 'Add New Task'}</h2>
                  <button type="button" onClick={resetTaskForm} className="text-sm font-medium text-neutral-500 hover:text-neutral-900">Cancel</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Task Title *</label>
                    <input
                      required
                      value={taskTitle}
                      onChange={(event) => setTaskTitle(event.target.value)}
                      placeholder="e.g. Prepare weekly social media content"
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Client Name</label>
                    <input
                      value={clientName}
                      onChange={(event) => setClientName(event.target.value)}
                      placeholder="Client or company"
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(event) => setPriority(event.target.value as VATask['priority'])}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Status</label>
                    <select
                      value={taskStatus}
                      onChange={(event) => setTaskStatus(event.target.value as VATask['status'])}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={taskDescription}
                      onChange={(event) => setTaskDescription(event.target.value)}
                      placeholder="Add task details or instructions..."
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={resetTaskForm} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700">Cancel</button>
                  <button type="submit" className={`rounded-xl px-5 py-2 text-sm font-bold ${t.accentBtn}`}>
                    {editingTaskId ? 'Save Changes' : 'Save Task'}
                  </button>
                </div>
              </form>
            )}

            {tasksLoading ? (
              <div className="p-12 text-center text-sm text-neutral-500">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="p-12 text-center bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl">
                <p className="text-sm font-medium text-neutral-500">No tasks added yet. Click “Add Task” to create your first task.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-bold text-neutral-900">{task.title}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            task.priority === 'high' ? 'bg-red-100 text-red-700' :
                            task.priority === 'low' ? 'bg-green-100 text-green-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority</span>
                        </div>
                        {task.description && <p className="text-sm text-neutral-600 whitespace-pre-wrap mb-2">{task.description}</p>}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                          {task.client_name && <span>👤 {task.client_name}</span>}
                          {task.due_date && <span>📅 Due {new Date(`${task.due_date}T00:00:00`).toLocaleDateString()}</span>}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          aria-label={`Status for ${task.title}`}
                          value={task.status}
                          onChange={(event) => handleTaskStatusChange(task.id, event.target.value as VATask['status'])}
                          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button onClick={() => openEditTaskForm(task)} className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">Edit</button>
                        <button onClick={() => handleDeleteTask(task.id)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

       
{activeTab === 'tracker' && (
  <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-black text-neutral-900">⏱️ Time Tracker</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Track working hours and monitor billable time
        </p>
      </div>

      {!activeTimer && (
        <button
          onClick={() => setShowTimerForm(!showTimerForm)}
          className={`px-4 py-2 ${t.accentBtn} rounded-xl text-sm font-bold`}
        >
          + Start Timer
        </button>
      )}
    </div>

    {timeError && (
      <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
        {timeError}
      </div>
    )}

    {showTimerForm && !activeTimer && (
      <form
        className="mb-6 p-5 rounded-xl border border-neutral-200 bg-neutral-50 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleStartTimer();
        }}
      >
        <h2 className="font-bold text-neutral-900">Start a New Timer</h2>

        <div>
          <label className="block text-xs font-bold mb-1 text-neutral-600">
            Client Name
          </label>
          <input
            value={timerClientName}
            onChange={(e) => setTimerClientName(e.target.value)}
            placeholder="Enter client name"
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1 text-neutral-600">
            Task Description *
          </label>
          <input
            required
            value={timerDescription}
            onChange={(e) => setTimerDescription(e.target.value)}
            placeholder="What are you working on?"
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1 text-neutral-600">
            Hourly Rate (₱)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowTimerForm(false)}
            className="px-4 py-2 rounded-xl border text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-5 py-2 rounded-xl ${t.accentBtn} text-sm font-bold`}
          >
            Start Working
          </button>
        </div>
      </form>
    )}

    {activeTimer && (
      <div className="mb-6 p-6 rounded-2xl border-2 border-green-200 bg-green-50">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold text-green-700">
            ● TIMER RUNNING
          </span>
          <span className="text-xs text-green-700">
            {activeTimer.client_name || 'No client selected'}
          </span>
        </div>

        <h2 className="font-bold text-neutral-900">
          {activeTimer.description || 'Working session'}
        </h2>

        <p className="text-4xl font-black text-neutral-900 my-5 tabular-nums">
          {String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0')}:
          {String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0')}:
          {String(elapsedSeconds % 60).padStart(2, '0')}
        </p>

        <button
          onClick={handleStopTimer}
          className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm"
        >
          ■ Stop Timer
        </button>
      </div>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
        <p className="text-xs font-bold text-neutral-500">TOTAL ENTRIES</p>
        <p className="text-2xl font-black mt-2">{timeEntries.length}</p>
      </div>

      <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
        <p className="text-xs font-bold text-neutral-500">COMPLETED HOURS</p>
        <p className="text-2xl font-black mt-2">
          {(timeEntries.reduce(
            (total, entry) => total + (entry.duration_seconds || 0), 0
          ) / 3600).toFixed(2)}
        </p>
      </div>

      <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
        <p className="text-xs font-bold text-neutral-500">BILLABLE EARNINGS</p>
        <p className={`text-2xl font-black mt-2 ${t.currencyColor}`}>
          ₱{timeEntries.reduce(
            (total, entry) =>
              total + (
                entry.is_billable
                  ? ((entry.duration_seconds || 0) / 3600) * (Number(entry.hourly_rate) || 0)
                  : 0
              ), 0
          ).toFixed(2)}
        </p>
      </div>
    </div>

    <h2 className="font-bold text-neutral-900 mb-4">Time Entry History</h2>

    {timeLoading ? (
      <p className="text-center py-8 text-sm text-neutral-500">
        Loading time entries...
      </p>
    ) : timeEntries.length === 0 ? (
      <div className="p-10 text-center bg-neutral-50 border border-dashed border-neutral-200 rounded-xl">
        <p className="text-3xl mb-2">⏱️</p>
        <p className="font-semibold text-neutral-700">No time entries yet</p>
        <p className="text-sm text-neutral-500 mt-1">
          Start your first timer to record working hours.
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {timeEntries.map((entry) => {
          const seconds = entry.duration_seconds || 0;

          return (
            <div
              key={entry.id}
              className="p-4 rounded-xl border border-neutral-200 bg-white"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                <div>
                  <h3 className="font-bold text-neutral-900">
                    {entry.description || 'Working session'}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    {entry.client_name || 'No client'}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {new Date(entry.started_at).toLocaleString()}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="font-black text-lg text-neutral-900">
                    {entry.ended_at
                      ? `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
                      : 'Running'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {entry.ended_at
                      ? formatPeso((seconds / 3600) * Number(entry.hourly_rate || 0))
                      : 'Active session'}
                  </p>
                  <span className={`inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full ${
                    entry.ended_at
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {entry.ended_at ? 'Completed' : 'In Progress'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTimeEntry(entry.id)}
                    className="mt-3 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete Entry
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}


    
{activeTab === 'projects' && (
  <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-black text-neutral-900">
          📁 Projects & Retainers
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage ongoing client projects and retainers
        </p>
      </div>

      <button
        onClick={openNewProjectForm}
        className={`px-4 py-2 ${t.accentBtn} rounded-xl text-sm font-bold`}
      >
        + New Project
      </button>
    </div>

    {projectError && (
      <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
        {projectError}
      </div>
    )}

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="p-4 rounded-xl bg-neutral-50 border">
        <p className="text-xs font-bold text-neutral-500">TOTAL PROJECTS</p>
        <p className="text-2xl font-black mt-2">{projects.length}</p>
      </div>

      <div className="p-4 rounded-xl bg-neutral-50 border">
        <p className="text-xs font-bold text-neutral-500">ACTIVE PROJECTS</p>
        <p className="text-2xl font-black mt-2">
          {projects.filter(p => p.status === 'active').length}
        </p>
      </div>

      <div className="p-4 rounded-xl bg-neutral-50 border">
        <p className="text-xs font-bold text-neutral-500">COMPLETED PROJECTS</p>
        <p className="text-2xl font-black mt-2">
          {projects.filter(p => p.status === 'completed').length}
        </p>
      </div>
    </div>

    {showProjectForm && (
      <form
        onSubmit={handleSaveProject}
        className="mb-6 p-5 rounded-2xl border border-neutral-200 bg-neutral-50"
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-neutral-900">
            {editingProjectId ? 'Edit Project' : 'Create New Project'}
          </h2>

          <button
            type="button"
            onClick={resetProjectForm}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            Cancel
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-neutral-600 mb-1">
              Project Name *
            </label>
            <input
              required
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-600 mb-1">
              Client Name
            </label>
            <input
              value={projectClient}
              onChange={e => setProjectClient(e.target.value)}
              placeholder="Client or company"
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-600 mb-1">
              Project Status
            </label>
            <select
              value={projectStatus}
              onChange={e => setProjectStatus(e.target.value as VAProject['status'])}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-600 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={projectStartDate}
              onChange={e => setProjectStartDate(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-600 mb-1">
              Deadline
            </label>
            <input
              type="date"
              value={projectDueDate}
              onChange={e => setProjectDueDate(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-600 mb-1">
              Project Budget / Retainer (₱)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={retainerAmount}
              onChange={e => setRetainerAmount(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-600 mb-1">
              Billing Cycle
            </label>
            <select
              value={billingCycle}
              onChange={e => setBillingCycle(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm"
            >
              <option value="one_time">One-Time</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-neutral-600 mb-1">
              Project Description
            </label>
            <textarea
              rows={3}
              value={projectDescription}
              onChange={e => setProjectDescription(e.target.value)}
              placeholder="Describe the project and deliverables..."
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={resetProjectForm}
            className="px-4 py-2 rounded-xl border bg-white text-sm font-semibold"
          >
            Cancel
          </button>

          <button
            type="submit"
            className={`px-5 py-2 rounded-xl ${t.accentBtn} text-sm font-bold`}
          >
            {editingProjectId ? 'Save Changes' : 'Save Project'}
          </button>
        </div>
      </form>
    )}

    {projectsLoading ? (
      <div className="p-10 text-center text-neutral-500">
        Loading projects...
      </div>
    ) : projects.length === 0 ? (
      <div className="p-12 text-center bg-neutral-50 border border-dashed border-neutral-200 rounded-xl">
        <p className="text-4xl mb-3">📁</p>
        <p className="font-semibold text-neutral-700">No projects yet</p>
        <p className="text-sm text-neutral-500 mt-1">
          Click New Project to add your first project.
        </p>
      </div>
    ) : (
      <div className="space-y-4">
        {projects.map(project => (
          <div
            key={project.id}
            className="p-5 rounded-xl border border-neutral-200 bg-white"
          >
            <div className="flex flex-col md:flex-row md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg text-neutral-900">
                    {project.project_name}
                  </h3>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    project.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : project.status === 'on_hold'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {project.status === 'on_hold'
                      ? 'On Hold'
                      : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </div>

                {project.client_name && (
                  <p className="text-sm text-neutral-600">
                    👤 {project.client_name}
                  </p>
                )}

                {project.description && (
                  <p className="text-sm text-neutral-500 mt-2 whitespace-pre-wrap">
                    {project.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 mt-3 text-xs text-neutral-500">
                  {project.start_date && (
                    <span>📅 Started: {new Date(`${project.start_date}T00:00:00`).toLocaleDateString()}</span>
                  )}
                  {project.due_date && (
                    <span>🏁 Deadline: {new Date(`${project.due_date}T00:00:00`).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              <div className="md:text-right">
                <p className={`text-xl font-black ${t.currencyColor}`}>
                  {formatPeso(project.retainer_amount)}
                </p>
                <p className="text-xs text-neutral-500 mb-3">
                  {project.billing_cycle.replace('_', ' ')}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditProjectForm(project)}
                    className="px-3 py-2 rounded-lg border text-xs font-semibold hover:bg-neutral-50"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}


      
{activeTab === 'invoices' && (
  <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-black text-neutral-900">
          💳 Invoices & Billing
        </h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Generate client invoices and track payments (₱)
        </p>
      </div>

      <button
        onClick={() => {
          resetInvoiceForm();
          setShowInvoiceForm(true);
        }}
        className={`px-4 py-2 ${t.accentBtn} rounded-xl text-sm font-bold`}
      >
        + Create Invoice
      </button>
    </div>

    {invoiceError && (
      <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
        {invoiceError}
      </div>
    )}

    {showInvoiceForm && (
      <form
        onSubmit={handleSaveInvoice}
        className="mb-6 p-5 rounded-xl border border-neutral-200 bg-neutral-50"
      >
        <div className="flex justify-between items-center mb-4">
         <h2 className="text-lg font-bold">
  {editingInvoiceId ? 'Edit Invoice' : 'Create New Invoice'}
</h2>
          <button
            type="button"
            onClick={resetInvoiceForm}
            className="text-sm text-neutral-500"
          >
            Cancel
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1">
              Client Name *
            </label>
            <input
              required
              value={invoiceClient}
              onChange={e => setInvoiceClient(e.target.value)}
              className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm"
              placeholder="Enter client name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Invoice Amount (₱) *
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={invoiceAmount}
              onChange={e => setInvoiceAmount(e.target.value)}
              className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Issue Date *
            </label>
            <input
              type="date"
              required
              value={invoiceIssueDate}
              onChange={e => setInvoiceIssueDate(e.target.value)}
              className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={invoiceDueDate}
              onChange={e => setInvoiceDueDate(e.target.value)}
              className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              Payment Status
            </label>
            <select
              value={invoiceStatus}
              onChange={e => setInvoiceStatus(e.target.value as VAInvoice['status'])}
              className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={invoiceDescription}
              onChange={e => setInvoiceDescription(e.target.value)}
              placeholder="Invoice details or services provided..."
              className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={resetInvoiceForm}
            className="px-4 py-2 rounded-xl border bg-white text-sm font-semibold"
          >
            Cancel
          </button>

          <button
            type="submit"
            className={`px-5 py-2 rounded-xl ${t.accentBtn} text-sm font-bold`}
          >
            Save Invoice
          </button>
        </div>
      </form>
    )}

    {invoicesLoading ? (
      <p className="text-center p-8 text-neutral-500">
        Loading invoices...
      </p>
    ) : invoices.length === 0 ? (
      <div className="p-12 text-center bg-neutral-50 border border-dashed rounded-xl">
        <p className="text-sm text-neutral-500">
          No invoices generated yet.
        </p>
      </div>
    ) : (
      <div className="space-y-3">
        {invoices.map(invoice => (
          <div
            key={invoice.id}
            className="p-5 rounded-xl border border-neutral-200 bg-white"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
              <div>
                <h3 className="font-bold text-neutral-900">
                  {invoice.invoice_number}
                </h3>
                <p className="text-sm text-neutral-600 mt-1">
                  👤 {invoice.client_name}
                </p>
                {invoice.description && (
                  <p className="text-sm text-neutral-500 mt-1">
                    {invoice.description}
                  </p>
                )}
                <p className="text-xs text-neutral-500 mt-2">
                  Issued: {invoice.issue_date}
                  {invoice.due_date && ` | Due: ${invoice.due_date}`}
                </p>
              </div>

              <div className="sm:text-right">
                <p className={`text-xl font-black ${t.currencyColor}`}>
                  ₱{Number(invoice.amount).toLocaleString('en-PH', {
                    minimumFractionDigits: 2
                  })}
                </p>
                
               <div className="flex items-center gap-2 mt-2 sm:justify-end">
  <span className="text-xs font-semibold capitalize">
    {invoice.status}
  </span>

  <button
    type="button"
    onClick={() => setViewingInvoice(invoice)}
    className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
  >
    View Invoice
  </button>
  <button
  type="button"
  onClick={() => openEditInvoiceForm(invoice)}
  className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
>
  Edit
</button>
  <button
    type="button"
    onClick={() => handleDeleteInvoice(invoice.id)}
    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
  >
    Delete
  </button>
</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}


{viewingInvoice && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-neutral-900">
          Invoice Details
        </h2>

        <button
          onClick={() => setViewingInvoice(null)}
          className="text-neutral-500 hover:text-neutral-900"
        >
          ✕
        </button>
      </div>

      <div className="border-b border-neutral-200 pb-5 mb-5">
        <h3 className="text-2xl font-black text-neutral-900">
          VA & Freelance
        </h3>
        <p className="text-sm text-neutral-500">
          INVOICE
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-neutral-500">Invoice Number</p>
          <p className="font-bold">
            {viewingInvoice.invoice_number}
          </p>
        </div>

        <div>
          <p className="text-xs text-neutral-500">Client</p>
          <p className="font-semibold">
            {viewingInvoice.client_name}
          </p>
        </div>

        <div>
          <p className="text-xs text-neutral-500">Description</p>
          <p>
            {viewingInvoice.description || 'No description'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-neutral-500">Issue Date</p>
            <p>{viewingInvoice.issue_date}</p>
          </div>

          <div>
            <p className="text-xs text-neutral-500">Due Date</p>
            <p>{viewingInvoice.due_date || 'Not specified'}</p>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <p className="text-xs text-neutral-500">Total Amount</p>
          <p className="text-3xl font-black text-amber-600">
          {formatPeso(viewingInvoice.amount)}
          </p>
        </div>

        <div>
          <p className="text-xs text-neutral-500">Payment Status</p>
          <p className="font-bold capitalize">
            {viewingInvoice.status}
          </p>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={() => setViewingInvoice(null)}
          className="rounded-xl bg-amber-600 px-5 py-2 text-sm font-bold text-white hover:bg-amber-700"
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}

     
{activeTab === 'reports' && (
  <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
    <h1 className="text-2xl font-black text-neutral-900 mb-1">
      📈 Performance Reports
    </h1>
    <p className="text-sm text-neutral-500 mb-6">
      Monthly analytics on billable hours and earnings
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* TOTAL MONTHLY LOGGED HOURS */}
      <div className="p-6 bg-neutral-50/50 rounded-2xl border border-neutral-200">
        <h3 className="font-bold text-neutral-800 mb-2">
          Total Monthly Logged Hours
        </h3>
        <p className={`text-3xl font-black ${t.currencyColor}`}>
          {(
            timeEntries
              .filter(entry =>
                reportMonth &&
                entry.started_at?.slice(0, 7) === reportMonth
              )
              .reduce(
                (total, entry) =>
                  total + (Number(entry.duration_seconds) || 0),
                0
              ) / 3600
          ).toFixed(2)} hrs
        </p>
      </div>

      {/* TOTAL MONTHLY REVENUE */}
      <div className="p-6 bg-neutral-50/50 rounded-2xl border border-neutral-200">
        <h3 className="font-bold text-neutral-800 mb-2">
          Total Monthly Revenue
        </h3>
        <p className={`text-3xl font-black ${t.currencyColor}`}>
          {formatPeso(
            timeEntries
              .filter(entry =>
                reportMonth &&
                entry.started_at?.slice(0, 7) === reportMonth &&
                entry.is_billable
              )
              .reduce(
                (total, entry) =>
                  total +
                  ((Number(entry.duration_seconds) || 0) / 3600) *
                  (Number(entry.hourly_rate) || 0),
                0
              )
          )}
        </p>
      </div>

{/* MONTHLY EARNINGS CHART */}
<div className="md:col-span-2 mt-6 p-6 bg-neutral-50/50 rounded-2xl border border-neutral-200">
  <h3 className="text-lg font-bold text-neutral-800 mb-1">
    Monthly Earnings Overview
  </h3>
  <p className="text-sm text-neutral-500 mb-6">
    Billable earnings over the last 6 months
  </p>

  <div className="flex items-end justify-between gap-3 h-52">
    {monthlyRevenueData.map((item, index) => (
      <div key={index} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
        <span className="text-xs font-semibold text-neutral-700">
          {formatPeso(item.revenue)}
        </span>

        <div className="w-full flex items-end justify-center flex-1">
          <div
            className="w-full max-w-16 bg-orange-500 rounded-t-lg transition-all duration-300"
            style={{
              height: `${Math.max(
                item.revenue > 0
                  ? (item.revenue / maxMonthlyRevenue) * 100
                  : 0,
                item.revenue > 0 ? 5 : 0
              )}%`,
              minHeight: item.revenue > 0 ? '6px' : '0'
            }}
          />
        </div>

        <span className="text-xs font-bold text-neutral-500">
          {item.month}
        </span>
      </div>
    ))}
  </div>
</div>

    </div>

{/* CLIENT-WISE EARNINGS BREAKDOWN */}
<div className="mt-6 p-6 bg-white rounded-2xl border border-neutral-200">
  <h3 className="text-lg font-bold text-neutral-900 mb-1">
    Client-Wise Earnings Breakdown
  </h3>
  <p className="text-sm text-neutral-500 mb-6">
    Track your working hours and earnings for each client
  </p>

  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead>
        <tr className="border-b border-neutral-200 text-neutral-500">
          <th className="py-3">Client</th>
          <th className="py-3">Logged Hours</th>
          <th className="py-3">Total Earnings</th>
          <th className="py-3">Revenue Share</th>
        </tr>
      </thead>

      <tbody>
        {clientWiseEarnings.length === 0 ? (
          <tr>
            <td colSpan={4} className="py-6 text-center text-neutral-500">
              No client earnings recorded yet.
            </td>
          </tr>
        ) : (
          clientWiseEarnings.map((item) => (
            <tr key={item.client} className="border-b border-neutral-100">
              <td className="py-4 font-semibold text-neutral-800">
                {item.client}
              </td>
              <td className="py-4 text-neutral-600">
                {(item.totalSeconds / 3600).toFixed(2)} hrs
              </td>
              <td className={`py-4 font-bold ${t.currencyColor}`}>
                {formatPeso(item.totalEarnings)}
              </td>
              <td className="py-4 text-neutral-600">
                {totalClientEarnings > 0
                  ? ((item.totalEarnings / totalClientEarnings) * 100).toFixed(1)
                  : '0.0'}%
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>

  </div>
)}


        {activeTab === 'documents' && (
          <>
          <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} mb-6`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-black text-neutral-900">🧾 BIR Tax Center</h1>
                <p className="text-sm text-neutral-500 mt-1">Income accumulation and BIR filing records · Non-VAT · 8% option</p>
              </div>
              <div className="w-full md:max-w-xs">
                <label className="block text-xs font-bold text-neutral-600 mb-2">TAX YEAR</label>
                <select value={selectedTaxYear || ''} onChange={e => setSelectedTaxYear(Number(e.target.value))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm">
                  {currentTaxYear > 0 && Array.from({length: currentTaxYear - 1999}, (_, i) => currentTaxYear - i)
                    .map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="text-xs font-bold text-neutral-500">PAID INVOICES (YEAR)</p>
                <p className="text-2xl font-black text-neutral-900 mt-2">{formatPeso(birInvoiceIncome)}</p>
                <p className="text-xs text-neutral-500 mt-1">{birYearInvoices.length} paid invoice(s)</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="text-xs font-bold text-neutral-500">MANUAL INCOME ADJUSTMENTS</p>
                <p className="text-2xl font-black text-neutral-900 mt-2">{formatPeso(birManualIncome)}</p>
                <p className="text-xs text-neutral-500 mt-1">{birYearAdjustments.length} additional entry/entries</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="text-xs font-bold text-neutral-500">ACCUMULATED GROSS INCOME</p>
                <p className="text-2xl font-black text-neutral-900 mt-2">{formatPeso(birGrossIncome)}</p>
                <p className="text-xs text-neutral-500 mt-1">Paid invoices + manual entries</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <p className="text-xs font-bold text-neutral-500">ILLUSTRATIVE 8% ESTIMATE</p>
                <p className="text-2xl font-black text-amber-600 mt-2">{formatPeso(birEstimatedTax)}</p>
                <p className="text-xs text-neutral-500 mt-1">Before tax credits and payments</p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6">
              <p className="text-sm font-bold text-amber-900">Tax estimate – verify before filing</p>
              <p className="text-sm text-amber-800 mt-1">
                This preliminary display applies 8% to gross income above ₱250,000, assuming you qualify for the reduction and the 8% election is valid for this year. It does not yet include other income, withholding tax credits, prior-quarter payments, or special tax adjustments. Paid invoice totals use invoice issue dates because the current invoice table has no payment-date field. Confirm the applicable BIR accounting method and dates before relying on this estimate.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-black text-neutral-900">Quarterly income accumulation</h2>
                <p className="text-sm text-neutral-500">Paid invoices plus manual reportable-income entries</p>
              </div>
              <button type="button" onClick={() => setShowBirAdjustmentForm(v => !v)}
                className={`px-4 py-2.5 ${t.accentBtn} rounded-xl text-sm font-bold`}>
                + Add Other BIR Income
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {birQuarterTotals.map((amount, index) => (
                <div key={index} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-bold text-neutral-500">Q{index + 1}</p>
                  <p className="text-lg font-black text-neutral-900 mt-1">{formatPeso(amount)}</p>
                </div>
              ))}
            </div>

            {showBirAdjustmentForm && (
              <form ref={birIncomeFormRef} id="bir-income-form" onSubmit={saveBIRAdjustment} className="relative z-20 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 mb-6 space-y-4">
                <h3 className="font-bold text-neutral-900">{editingBirAdjustmentId ? 'Edit manual income entry' : 'Add manual reportable income'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">DESCRIPTION *</label>
                    <input required value={birIncomeDescription} onChange={e => setBirIncomeDescription(e.target.value)}
                      placeholder="e.g. Other professional income" className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">AMOUNT (₱) *</label>
                    <input required type="text" inputMode="decimal" value={birIncomeAmount}
                      onChange={e => setBirIncomeAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                      onBlur={() => {
                        const parsed = Number(birIncomeAmount.replace(/,/g, ''));
                        if (birIncomeAmount && Number.isFinite(parsed)) {
                          setBirIncomeAmount(parsed.toLocaleString('en-PH', { maximumFractionDigits: 2 }));
                        }
                      }}
                      placeholder="0.00" className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">INCOME DATE *</label>
                    <input required type="date" value={birIncomeDate} onChange={e => setBirIncomeDate(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">SOURCE</label>
                    <select value={birIncomeSource} onChange={e => setBirIncomeSource(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm">
                      <option>Other reportable income</option><option>Client payment outside VA invoices</option>
                      <option>Platform income</option><option>Other professional fees</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-600 mb-1">SUPPORTING DOCUMENT LINK (OPTIONAL)</label>
                    <input
                      type="url"
                      value={birIncomeDocumentUrl}
                      onChange={e => setBirIncomeDocumentUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Add a Google Drive, OneDrive, Dropbox, or other share link for the receipt or supporting record.
                    </p>
                  </div>
                </div>
                {birAdjustmentError && <p className="text-sm text-red-600">{birAdjustmentError}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={resetBIRAdjustmentForm} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm">Cancel</button>
                  <button disabled={birAdjustmentSaving} className={`rounded-xl px-5 py-2 text-sm font-bold text-white ${t.accentBtn} disabled:opacity-50`}>
                    {birAdjustmentSaving ? 'Saving...' : editingBirAdjustmentId ? 'Update Income Entry' : 'Save Income Entry'}
                  </button>
                </div>
              </form>
            )}

            <div className="mb-6">
              <h3 className="font-bold text-neutral-900 mb-3">Manual income entries – {selectedTaxYear}</h3>
              {birAdjustmentsLoading ? <p className="text-sm text-neutral-500">Loading entries...</p> :
                birYearAdjustments.length === 0 ? <p className="text-sm text-neutral-500">No manual entries recorded for this year.</p> :
                <div className="space-y-2">
                  {birYearAdjustments.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white p-3">
                      <div className="min-w-0"><p className="font-semibold text-sm text-neutral-900">{item.description}</p>
                        <p className="text-xs text-neutral-500">{item.income_date} · {item.source || 'Manual entry'}</p>
                        {item.document_url && (
                          <a href={item.document_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-blue-700 hover:underline">
                            ↗ Open supporting document
                          </a>
                        )}</div>
                      <div className="flex items-center gap-3"><span className="font-bold text-neutral-900">{formatPeso(item.amount)}</span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            editBIRAdjustment(item);
                          }}
                          className="relative z-30 pointer-events-auto cursor-pointer rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          Edit
                        </button>
                        <button type="button" onClick={() => deleteBIRAdjustment(item.id)} className="text-xs font-semibold text-red-600">Delete</button></div>
                    </div>
                  ))}
                </div>}
              {birAdjustmentError && !showBirAdjustmentForm && <p className="text-sm text-red-600 mt-2">{birAdjustmentError}</p>}
            </div>
          </div>

          <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-black text-neutral-900">📂 BIR Document Vault</h1>
                <p className="text-sm text-neutral-500 mt-1">
                  Keep links to your filed returns, payment receipts, and supporting records.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewDocumentForm}
                className={`px-5 py-2.5 ${t.accentBtn} rounded-xl text-sm font-bold`}
              >
                + Add Document
              </button>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6">
              <p className="text-sm font-bold text-amber-900">External links only</p>
              <p className="text-sm text-amber-800 mt-1">
                Add a Google Drive, OneDrive, or Dropbox link. The scanned file stays in your cloud storage;
                this dashboard saves only its link and document details.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
              <div className="w-full sm:max-w-xs">
                <label className="block text-xs font-bold text-neutral-600 mb-2">TAX YEAR</label>
                <select
                  value={selectedTaxYear || ''}
                  onChange={(e) => setSelectedTaxYear(Number(e.target.value))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800"
                >
                  {currentTaxYear > 0 && Array.from(
                    { length: currentTaxYear - 1999 },
                    (_, index) => currentTaxYear - index
                  ).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-neutral-500">
                {documents.filter(doc => doc.tax_year === selectedTaxYear).length} record(s) for {selectedTaxYear || 'selected year'}
              </div>
            </div>

            {documentError && !showDocumentForm && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {documentError}
              </div>
            )}

            {showDocumentForm && (
              <form ref={documentFormRef} onSubmit={saveDocument} className="mb-6 scroll-mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-neutral-900">
                    {editingDocumentId ? 'Edit Document Record' : 'Add BIR Document'}
                  </h2>
                  <button type="button" onClick={resetDocumentForm} className="text-sm text-neutral-500 hover:text-neutral-900">
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">DOCUMENT NAME *</label>
                    <input
                      required
                      value={documentName}
                      onChange={e => setDocumentName(e.target.value)}
                      placeholder="e.g. 2551Q Q1 2026 - Filed Copy"
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">DOCUMENT CATEGORY *</label>
                    <select
                      required
                      value={documentCategory}
                      onChange={e => setDocumentCategory(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
                    >
                      <option value="1701Q">BIR Form 1701Q – Quarterly Income Tax</option>
                      <option value="1701A">BIR Form 1701A – Annual Income Tax</option>
                      <option value="2551Q">BIR Form 2551Q – Percentage Tax</option>
                      <option value="Payment Receipt">BIR Payment Receipt / Confirmation</option>
                      <option value="Registration">BIR Registration / Certificate</option>
                      <option value="Books and Invoices">Books of Accounts / Invoices</option>
                      <option value="Other">Other Supporting Document</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">REPORTING PERIOD</label>
                    <select
                      value={documentPeriod}
                      onChange={e => setDocumentPeriod(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
                    >
                      <option value="Q1">Quarter 1</option>
                      <option value="Q2">Quarter 2</option>
                      <option value="Q3">Quarter 3</option>
                      <option value="Q4">Quarter 4</option>
                      <option value="Annual">Annual</option>
                      <option value="Payment">Payment</option>
                      <option value="N/A">Not applicable</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">FILING STATUS</label>
                    <select
                      value={documentFilingStatus}
                      onChange={e => setDocumentFilingStatus(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
                    >
                      <option value="Filed">Filed</option>
                      <option value="Zero Filing">Zero Filing</option>
                      <option value="Pending">Pending</option>
                      <option value="Payment Record">Payment Record</option>
                      <option value="Supporting Document">Supporting Document</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">DOCUMENT / FILING DATE</label>
                    <input
                      type="date"
                      value={documentDate}
                      onChange={e => setDocumentDate(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">EXTERNAL DOCUMENT LINK *</label>
                  <input
                    type="url"
                    required
                    value={documentUrl}
                    onChange={e => setDocumentUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Use a share link that only the intended reviewer can access. Avoid public links containing sensitive information.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1">NOTES</label>
                  <textarea
                    rows={2}
                    value={documentNotes}
                    onChange={e => setDocumentNotes(e.target.value)}
                    placeholder="e.g. Filed online; payment confirmation saved separately."
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
                  />
                </div>

                {documentError && (
                  <p className="text-sm text-red-600">{documentError}</p>
                )}

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={resetDocumentForm} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={documentSaving}
                    className={`rounded-xl px-5 py-2 text-sm font-bold text-white ${t.accentBtn} disabled:opacity-50`}
                  >
                    {documentSaving ? 'Saving...' : editingDocumentId ? 'Update Record' : 'Save Document'}
                  </button>
                </div>
              </form>
            )}

            {documentsLoading ? (
              <div className="py-12 text-center text-sm text-neutral-500">Loading your document records...</div>
            ) : (
              <div className="space-y-3">
                {documents.filter(doc => doc.tax_year === selectedTaxYear).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-300 py-12 text-center">
                    <div className="text-4xl mb-3">🗂️</div>
                    <p className="font-bold text-neutral-800">No documents for {selectedTaxYear || 'this year'} yet</p>
                    <p className="text-sm text-neutral-500 mt-1">Add your filed returns, payment receipts, or supporting documents.</p>
                  </div>
                ) : (
                  documents
                    .filter(doc => doc.tax_year === selectedTaxYear)
                    .map(doc => (
                      <div key={doc.id} className="rounded-xl border border-neutral-200 bg-white p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-bold rounded-full bg-amber-100 text-amber-800 px-2.5 py-1">{doc.category}</span>
                            {doc.reporting_period && <span className="text-xs text-neutral-500">{doc.reporting_period}</span>}
                            <span className="text-xs rounded-full bg-neutral-100 text-neutral-700 px-2.5 py-1">{doc.filing_status}</span>
                          </div>
                          <p className="font-bold text-neutral-900 break-words">{doc.document_name}</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {doc.document_date ? `Date: ${doc.document_date}` : 'Date not specified'}
                          </p>
                          {doc.notes && <p className="text-sm text-neutral-600 mt-2 whitespace-pre-wrap">{doc.notes}</p>}
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <a
                            href={doc.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700"
                          >
                            Open Document ↗
                          </a>
                          <button type="button" onClick={() => openEditDocumentForm(doc)} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700">
                            Edit
                          </button>
                          <button type="button" onClick={() => deleteDocument(doc.id)} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
          </>
        )}

        {activeTab === 'settings' && (
          <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} max-w-2xl`}>
            <h1 className="text-2xl font-black text-neutral-900 mb-1">⚙️ Account Settings</h1>
            <p className="text-sm text-neutral-500 mb-6">Manage profile and dashboard appearance theme</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Dashboard Theme Customizer</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button onClick={() => handleThemeChange('charcoal')} className={`p-3 rounded-xl border text-left font-medium text-sm transition ${theme === 'charcoal' ? 'border-amber-600 bg-amber-50/50 text-neutral-900 ring-2 ring-amber-600/20' : 'border-neutral-200 bg-white text-neutral-700'}`}>💼 Charcoal & Amber</button>
                  <button onClick={() => handleThemeChange('teal')} className={`p-3 rounded-xl border text-left font-medium text-sm transition ${theme === 'teal' ? 'border-teal-600 bg-teal-50/50 text-teal-900 ring-2 ring-teal-600/20' : 'border-neutral-200 bg-white text-neutral-700'}`}>🌿 Modern Teal</button>
                  <button onClick={() => handleThemeChange('indigo')} className={`p-3 rounded-xl border text-left font-medium text-sm transition ${theme === 'indigo' ? 'border-indigo-600 bg-indigo-50/50 text-neutral-900 ring-2 ring-indigo-600/20' : 'border-neutral-200 bg-white text-neutral-700'}`}>🎓 Ocean Indigo</button>
                  <button onClick={() => handleThemeChange('pink')} className={`p-3 rounded-xl border text-left font-medium text-sm transition ${theme === 'pink' ? 'border-[#FF2E7E] bg-pink-50/50 text-neutral-900 ring-2 ring-pink-600/20' : 'border-neutral-200 bg-white text-neutral-700'}`}>🌸 Vibrant Pink</button>
                  <button onClick={() => handleThemeChange('colorful')} className={`p-3 rounded-xl border text-left font-medium text-sm transition ${theme === 'colorful' ? 'border-purple-600 bg-purple-50/50 text-neutral-900 ring-2 ring-purple-600/20' : 'border-neutral-200 bg-white text-neutral-700'}`}>🌈 Colorful Gradient</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Email Address</label>
                <input type="email" disabled value={user?.email || ''} className="w-full px-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-sm text-neutral-600" />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Default Hourly Rate (₱)</label>
                <input type="number" defaultValue="600" className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900" />
              </div>

              <button className={`px-5 py-2.5 ${t.accentBtn} rounded-xl text-sm font-bold shadow-xs transition`}>Save Changes</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}