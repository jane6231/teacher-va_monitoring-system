'use client';

import { Fragment, useState, useEffect, useRef, type FormEvent } from 'react';
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


type VAClient = {
  id: string;
  user_id: string;
  client_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  status: 'active' | 'inactive';
  hourly_rate: number;
  currency_code: string;
  created_at: string;
  updated_at: string;
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
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  receipt_url: string | null;
  project_id?: string | null;
  payment_terms?: string | null;
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

type VACashTransaction = {
  id: string; user_id: string; transaction_date: string;
  transaction_type: 'receipt' | 'disbursement'; description: string;
  counterparty: string | null; category: string; amount: number;
  payment_method: string | null; reference_no: string | null;
  notes_url: string | null; created_at: string; updated_at: string;
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
  const [invoiceProfile, setInvoiceProfile] = useState({
    fullName: '',
    businessAddress: '',
    tin: '',
    contactNumber: '',
  });
  const [invoiceProfileSaving, setInvoiceProfileSaving] = useState(false);
  const [invoiceProfileMessage, setInvoiceProfileMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workView, setWorkView] = useState<'tasks' | 'projects'>('tasks');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedNavGroups, setExpandedNavGroups] = useState<Record<string, boolean>>({
    overview: true,
    work: false,
    finance: false,
    tax: false,
  });
  const [theme, setTheme] = useState('charcoal');
const [calendarDate, setCalendarDate] = useState<Date | null>(null);
const [activePeriod, setActivePeriod] = useState('month');
const [currentCalendarYear, setCurrentCalendarYear] = useState<number | null>(null);

useEffect(() => {
  const now = new Date();
  setCalendarDate(now);
  setCurrentCalendarYear(now.getFullYear());
}, []);
const handleToday = () => {
  setCalendarDate(new Date());
  setActivePeriod('today');
};

const handleThisWeek = () => {
  setCalendarDate(new Date());
  setActivePeriod('week');
};

const handleThisMonth = () => {
  setCalendarDate(new Date());
  setActivePeriod('month');
};

const handleThisYear = () => {
  setCalendarDate(new Date(new Date().getFullYear(), 0, 1));
  setActivePeriod('year');
};

const handlePrevMonth = () => {
  setCalendarDate(prev => {
    const date = prev ?? new Date();
    return new Date(date.getFullYear(), date.getMonth() - 1, 1);
  });
  setActivePeriod('month');
};

const handleNextMonth = () => {
  setCalendarDate(prev => {
    const date = prev ?? new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
  });
  setActivePeriod('month');
};
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
  const [clients, setClients] = useState<VAClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientError, setClientError] = useState('');
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [savingClient, setSavingClient] = useState(false);

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
const [projectCreateInvoice, setProjectCreateInvoice] = useState<'yes' | 'no'>('no');
const [projectInvoiceAmount, setProjectInvoiceAmount] = useState('');
const [projectInvoiceDueDate, setProjectInvoiceDueDate] = useState('');
const [projectInvoicePaymentTerms, setProjectInvoicePaymentTerms] = useState('');


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
const [issuingInvoice, setIssuingInvoice] = useState(false);

const [invoiceClient, setInvoiceClient] = useState('');
const [invoiceDescription, setInvoiceDescription] = useState('');
const [invoiceReceiptUrl, setInvoiceReceiptUrl] = useState('');
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


  const [cashTransactions, setCashTransactions] = useState<VACashTransaction[]>([]);
  const [cashTransactionsLoading, setCashTransactionsLoading] = useState(false);
  const [cashTransactionError, setCashTransactionError] = useState('');
  const [showCashTransactionForm, setShowCashTransactionForm] = useState(false);
  const [editingCashTransactionId, setEditingCashTransactionId] = useState<string | null>(null);
  const [cashTransactionDate, setCashTransactionDate] = useState('');
  const [cashTransactionType, setCashTransactionType] = useState<'receipt' | 'disbursement'>('receipt');
  const [cashTransactionDescription, setCashTransactionDescription] = useState('');
  const [cashTransactionCounterparty, setCashTransactionCounterparty] = useState('');
  const [cashTransactionCategory, setCashTransactionCategory] = useState('Professional fees');
  const [cashTransactionAmount, setCashTransactionAmount] = useState('');
  const [cashTransactionPaymentMethod, setCashTransactionPaymentMethod] = useState('Bank transfer');
  const [cashTransactionReference, setCashTransactionReference] = useState('');
  const [cashTransactionNotesUrl, setCashTransactionNotesUrl] = useState('');
  const [cashTransactionSaving, setCashTransactionSaving] = useState(false);
  const [cashRegisterYear, setCashRegisterYear] = useState(0);
  useEffect(() => { setCashRegisterYear(new Date().getFullYear()); }, []);


  type VAGeneralJournalEntry = {
    id: string; user_id: string; entry_date: string; entry_number: string | null;
    description: string; debit_account: string; credit_account: string;
    amount: number; notes_url: string | null; created_at: string;
  };
  const JOURNAL_ACCOUNTS = [
    'Cash on Hand', 'Cash in Bank', 'Accounts Receivable', 'Computer and Equipment',
    'Accumulated Depreciation', 'Accounts Payable', 'Owner\'s Capital', 'Owner\'s Drawings',
    'Professional Fees Income', 'Other Business Income', 'Office Supplies Expense',
    'Internet and Communications Expense', 'Utilities Expense', 'Transportation Expense',
    'Software and Subscriptions Expense', 'Repairs and Maintenance Expense',
    'Taxes and Licenses Expense', 'Bank Charges Expense', 'Depreciation Expense',
    'Other Operating Expense'
  ];
  type VAChartAccount = { id: string; user_id: string; account_code: string; account_name: string; account_type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense'; normal_balance: 'Debit' | 'Credit'; description: string | null; is_active: boolean; created_at: string; updated_at: string; };
  const [chartAccounts, setChartAccounts] = useState<VAChartAccount[]>([]);
  const [chartAccountsLoading, setChartAccountsLoading] = useState(false);
  const [chartAccountsError, setChartAccountsError] = useState('');
  const [showChartAccountForm, setShowChartAccountForm] = useState(false);
  const [editingChartAccountId, setEditingChartAccountId] = useState<string | null>(null);
  const [chartAccountCode, setChartAccountCode] = useState('');
  const [chartAccountName, setChartAccountName] = useState('');
  const [chartAccountType, setChartAccountType] = useState<VAChartAccount['account_type']>('Asset');
  const [chartAccountNormalBalance, setChartAccountNormalBalance] = useState<VAChartAccount['normal_balance']>('Debit');
  const [chartAccountDescription, setChartAccountDescription] = useState('');
  const [chartAccountSaving, setChartAccountSaving] = useState(false);
  const activeJournalAccountNames = chartAccounts.length ? chartAccounts.filter(a => a.is_active).map(a => a.account_name) : JOURNAL_ACCOUNTS;
  const [journalEntries, setJournalEntries] = useState<VAGeneralJournalEntry[]>([]);
  const [journalLoading, setJournalLoading] = useState(false);
  const [journalError, setJournalError] = useState('');
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [journalDate, setJournalDate] = useState('');
  const [journalNumber, setJournalNumber] = useState('');
  const [journalDescription, setJournalDescription] = useState('');
  const [journalDebitAccount, setJournalDebitAccount] = useState('Cash in Bank');
  const [journalCreditAccount, setJournalCreditAccount] = useState("Owner's Capital");
  const [journalAmount, setJournalAmount] = useState('');
  const [journalNotesUrl, setJournalNotesUrl] = useState('');
  const [journalSaving, setJournalSaving] = useState(false);
  const [journalYear, setJournalYear] = useState(0);
  const [statementBasis, setStatementBasis] = useState<'monthly' | 'annual'>('annual');
  const [statementMonth, setStatementMonth] = useState("01");
  useEffect(() => {
  const now = new Date();

  setJournalYear(now.getFullYear());
  setJournalDate(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  );
  setStatementMonth(
    String(now.getMonth() + 1).padStart(2, "0")
  );
}, []);

  async function loadChartAccounts(userId: string) {
    setChartAccountsLoading(true);
    setChartAccountsError('');
    const { data, error } = await supabase.from('va_chart_of_accounts').select('*').eq('user_id', userId).order('account_code');
    if (error) { setChartAccountsError(error.message); setChartAccounts([]); }
    else setChartAccounts((data || []) as VAChartAccount[]);
    setChartAccountsLoading(false);
  }

  function resetChartAccountForm() {
    setEditingChartAccountId(null); setChartAccountCode(''); setChartAccountName('');
    setChartAccountType('Asset'); setChartAccountNormalBalance('Debit');
    setChartAccountDescription(''); setShowChartAccountForm(false); setChartAccountsError('');
  }

  function editChartAccount(a: VAChartAccount) {
    setEditingChartAccountId(a.id); setChartAccountCode(a.account_code); setChartAccountName(a.account_name);
    setChartAccountType(a.account_type); setChartAccountNormalBalance(a.normal_balance);
    setChartAccountDescription(a.description || ''); setShowChartAccountForm(true);
  }

  async function saveChartAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.id) return;
    if (!chartAccountCode.trim() || !chartAccountName.trim()) { setChartAccountsError('Enter an account code and account name.'); return; }
    setChartAccountSaving(true); setChartAccountsError('');
    const payload = { user_id: user.id, account_code: chartAccountCode.trim(), account_name: chartAccountName.trim(), account_type: chartAccountType, normal_balance: chartAccountNormalBalance, description: chartAccountDescription.trim() || null, updated_at: new Date().toISOString() };
    const query = editingChartAccountId
      ? supabase.from('va_chart_of_accounts').update(payload).eq('id', editingChartAccountId).eq('user_id', user.id)
      : supabase.from('va_chart_of_accounts').insert(payload);
    const { error } = await query;
    if (error) setChartAccountsError(error.message);
    else { resetChartAccountForm(); await loadChartAccounts(user.id); }
    setChartAccountSaving(false);
  }

  async function toggleChartAccount(a: VAChartAccount) {
    if (!user?.id) return;
    const { error } = await supabase.from('va_chart_of_accounts').update({ is_active: !a.is_active, updated_at: new Date().toISOString() }).eq('id', a.id).eq('user_id', user.id);
    if (error) setChartAccountsError(error.message); else await loadChartAccounts(user.id);
  }

  async function loadJournalEntries(userId: string) {
    setJournalLoading(true);
    setJournalError('');
    const { data, error } = await supabase.from('va_general_journal')
      .select('*').eq('user_id', userId)
      .order('entry_date', { ascending: false }).order('created_at', { ascending: false });
    if (error) { setJournalError(error.message); setJournalEntries([]); }
    else setJournalEntries((data || []) as VAGeneralJournalEntry[]);
    setJournalLoading(false);
  }

  function resetJournalForm() {
    setEditingJournalId(null);
    setJournalDate(new Date().toISOString().slice(0, 10));
    setJournalNumber('');
    setJournalDescription('');
    setJournalDebitAccount('Cash in Bank');
    setJournalCreditAccount("Owner's Capital");
    setJournalAmount('');
    setJournalNotesUrl('');
    setJournalError('');
    setShowJournalForm(false);
  }

  function editJournalEntry(entry: VAGeneralJournalEntry) {
    setEditingJournalId(entry.id);
    setJournalDate(entry.entry_date);
    setJournalNumber(entry.entry_number || '');
    setJournalDescription(entry.description);
    setJournalDebitAccount(entry.debit_account);
    setJournalCreditAccount(entry.credit_account);
    setJournalAmount(String(entry.amount));
    setJournalNotesUrl(entry.notes_url || '');
    setShowJournalForm(true);
  }

  async function saveJournalEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.id) return;
    const amount = Number(journalAmount.replace(/,/g, ''));
    const notesUrl = journalNotesUrl.trim();
    if (!journalDate || !journalDescription.trim() || !Number.isFinite(amount) || amount <= 0) {
      setJournalError('Enter a date, description, and amount greater than zero.');
      return;
    }
    if (journalDebitAccount === journalCreditAccount) {
      setJournalError('Debit and credit accounts must be different.');
      return;
    }
    if (notesUrl && !/^https:\/\//i.test(notesUrl)) {
      setJournalError('The supporting-document link must begin with https://');
      return;
    }
    setJournalSaving(true);
    setJournalError('');
    const payload = {
      user_id: user.id, entry_date: journalDate,
      entry_number: journalNumber.trim() || null,
      description: journalDescription.trim(),
      debit_account: journalDebitAccount, credit_account: journalCreditAccount,
      amount, notes_url: notesUrl || null, updated_at: new Date().toISOString()
    };
    const query = editingJournalId
      ? supabase.from('va_general_journal').update(payload).eq('id', editingJournalId).eq('user_id', user.id)
      : supabase.from('va_general_journal').insert(payload);
    const { error } = await query;
    if (error) setJournalError(error.message);
    else { resetJournalForm(); await loadJournalEntries(user.id); }
    setJournalSaving(false);
  }

  async function deleteJournalEntry(id: string) {
    if (!user?.id || !window.confirm('Delete this general journal entry?')) return;
    const { error } = await supabase.from('va_general_journal').delete().eq('id', id).eq('user_id', user.id);
    if (error) setJournalError(error.message);
    else await loadJournalEntries(user.id);
  }

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

  async function loadClients(userId: string) {
    setClientsLoading(true);
    setClientError('');

    const { data, error } = await supabase
      .from('va_clients')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('client_name', { ascending: true });

    if (error) {
      setClientError(error.message);
      setClients([]);
    } else {
      setClients((data || []) as VAClient[]);
    }

    setClientsLoading(false);
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
await loadCashTransactions(user.id);
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


async function loadCashTransactions(userId: string) {
  setCashTransactionsLoading(true);
  setCashTransactionError('');
  const { data, error } = await supabase.from('va_cash_transactions')
    .select('*').eq('user_id', userId)
    .order('transaction_date', { ascending: false });
  if (error) {
    setCashTransactionError(error.message);
    setCashTransactions([]);
  } else setCashTransactions((data || []) as VACashTransaction[]);
  setCashTransactionsLoading(false);
}

function resetCashTransactionForm() {
  setEditingCashTransactionId(null);
  setCashTransactionDate(new Date().toISOString().slice(0, 10));
  setCashTransactionType('receipt');
  setCashTransactionDescription('');
  setCashTransactionCounterparty('');
  setCashTransactionCategory('Professional fees');
  setCashTransactionAmount('');
  setCashTransactionPaymentMethod('Bank transfer');
  setCashTransactionReference('');
  setCashTransactionNotesUrl('');
  setCashTransactionError('');
  setShowCashTransactionForm(false);
}

function openEditCashTransaction(item: VACashTransaction) {
  setEditingCashTransactionId(item.id);
  setCashTransactionDate(item.transaction_date);
  setCashTransactionType(item.transaction_type);
  setCashTransactionDescription(item.description);
  setCashTransactionCounterparty(item.counterparty || '');
  setCashTransactionCategory(item.category);
  setCashTransactionAmount(String(item.amount));
  setCashTransactionPaymentMethod(item.payment_method || 'Other');
  setCashTransactionReference(item.reference_no || '');
  setCashTransactionNotesUrl(item.notes_url || '');
  setCashTransactionError('');
  setShowCashTransactionForm(true);
}

async function saveCashTransaction(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if (!user?.id) return;
  const amount = Number(cashTransactionAmount.replace(/,/g, ''));
  if (!cashTransactionDate || !cashTransactionDescription.trim() || !Number.isFinite(amount) || amount <= 0) {
    setCashTransactionError('Enter a date, description, and amount greater than zero.');
    return;
  }
  const notesUrl = cashTransactionNotesUrl.trim();
  if (notesUrl && !/^https:\/\//i.test(notesUrl)) {
    setCashTransactionError('The supporting-document link must begin with https://');
    return;
  }

  setCashTransactionSaving(true);
  setCashTransactionError('');
  const payload = {
    user_id: user.id,
    transaction_date: cashTransactionDate,
    transaction_type: cashTransactionType,
    description: cashTransactionDescription.trim(),
    counterparty: cashTransactionCounterparty.trim() || null,
    category: cashTransactionCategory,
    amount,
    payment_method: cashTransactionPaymentMethod || null,
    reference_no: cashTransactionReference.trim() || null,
    notes_url: notesUrl || null,
    updated_at: new Date().toISOString(),
  };
  const query = editingCashTransactionId
    ? supabase.from('va_cash_transactions').update(payload).eq('id', editingCashTransactionId).eq('user_id', user.id)
    : supabase.from('va_cash_transactions').insert(payload);
  const { error } = await query;
  if (error) setCashTransactionError(error.message);
  else {
    resetCashTransactionForm();
    await loadCashTransactions(user.id);
  }
  setCashTransactionSaving(false);
}

async function deleteCashTransaction(id: string) {
  if (!user?.id || !window.confirm('Delete this cash book entry?')) return;
  const { error } = await supabase.from('va_cash_transactions').delete().eq('id', id).eq('user_id', user.id);
  if (error) setCashTransactionError(error.message);
  else await loadCashTransactions(user.id);
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
    const savedTheme = localStorage.getItem('teacher_dashboard_theme');
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
      setInvoiceProfile({
        fullName: user.user_metadata?.invoice_full_name || '',
        businessAddress: user.user_metadata?.invoice_business_address || '',
        tin: user.user_metadata?.invoice_tin || '',
        contactNumber: user.user_metadata?.invoice_contact_number || '',
      });
await loadTasks(user.id);
await loadClients(user.id);
await loadTimeEntries(user.id);
await loadProjects(user.id);
await loadInvoices(user.id);
await loadDocuments(user.id);
await loadBIRAdjustments(user.id);
await loadCashTransactions(user.id);
await loadJournalEntries(user.id);
await loadChartAccounts(user.id);
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
  ? Array.from({ length: 12 }, (_, index) => {
      // Always show all calendar months, January through December.
      // Months without recorded income remain visible with a value of zero.
      const date = new Date(chartReferenceDate.getFullYear(), index, 1);

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;

      const billableTimeIncome = timeEntries
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

      // Include manual BIR income entries alongside billable time-tracker income.
      const manualIncome = birAdjustments
        .filter(item => item.income_date?.slice(0, 7) === monthKey)
        .reduce((total, item) => total + (Number(item.amount) || 0), 0);

      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        monthKey,
        revenue: billableTimeIncome + manualIncome,
      };
    })
  : [];

const maxMonthlyRevenue = Math.max(
  ...monthlyRevenueData.map(item => item.revenue),
  1
);
// Revenue card: accumulate income for the current calendar year only.
// This prevents previous tax years from being added to the current year's total.
const currentCalendarYearString = currentCalendarYear === null
  ? ''
  : String(currentCalendarYear);

const totalRecordedRevenue =
  timeEntries
    .filter(
      entry =>
        entry.is_billable &&
        entry.started_at?.slice(0, 4) === currentCalendarYearString
    )
    .reduce(
      (total, entry) =>
        total +
        ((Number(entry.duration_seconds) || 0) / 3600) *
          (Number(entry.hourly_rate) || 0),
      0
    ) +
  birAdjustments
    .filter(item => item.income_date?.slice(0, 4) === currentCalendarYearString)
    .reduce(
      (total, item) => total + (Number(item.amount) || 0),
      0
    );

const paidInvoiceCount = invoices.filter(
  invoice =>
    invoice.status === 'paid' &&
    invoice.issue_date?.slice(0, 4) === currentCalendarYearString
).length;

type ClientEarning = {
  client: string;
  totalSeconds: number;
  totalEarnings: number;
};

const clientWiseEarnings: ClientEarning[] = Object.values(
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
  }, {} as Record<string, ClientEarning>)
) as ClientEarning[];

clientWiseEarnings.sort((a, b) => b.totalEarnings - a.totalEarnings);

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
  localStorage.setItem('teacher_dashboard_theme', newTheme);
};

  const resetNewClientForm = () => {
    setNewClientName('');
    setNewClientEmail('');
    setNewClientCompany('');
    setNewClientPhone('');
    setClientError('');
    setShowAddClientForm(false);
  };

  const resetTaskForm = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskDescription('');
    setClientName('');
    setDueDate('');
    setPriority('medium');
    setTaskStatus('pending');
    resetNewClientForm();
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

  const handleAddClient = async () => {
    if (!user) return;

    const trimmedName = newClientName.trim();
    if (!trimmedName) {
      setClientError('Please enter a client name.');
      return;
    }

    setSavingClient(true);
    setClientError('');

    const { data, error } = await supabase
      .from('va_clients')
      .insert({
        user_id: user.id,
        client_name: trimmedName,
        email: newClientEmail.trim() || null,
        company: newClientCompany.trim() || null,
        phone: newClientPhone.trim() || null,
        status: 'active',
      })
      .select('*')
      .single();

    if (error) {
      setClientError(error.message);
      setSavingClient(false);
      return;
    }

    setClients((current) =>
      [...current, data as VAClient].sort((a, b) =>
        a.client_name.localeCompare(b.client_name)
      )
    );
    setClientName((data as VAClient).client_name);
    setProjectClient((data as VAClient).client_name);
    resetNewClientForm();
    setSavingClient(false);
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
  setProjectCreateInvoice('no');
  setProjectInvoiceAmount('');
  setProjectInvoiceDueDate('');
  setProjectInvoicePaymentTerms('');
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
  setProjectCreateInvoice('no');
  setProjectInvoiceAmount('');
  setProjectInvoiceDueDate('');
  setProjectInvoicePaymentTerms('');
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

  if (!editingProjectId && projectCreateInvoice === 'yes') {
    const invoiceAmountValue = Number(projectInvoiceAmount || amount);
    if (!projectClient.trim()) {
      setProjectError('Select a client before creating an invoice.');
      return;
    }
    if (!Number.isFinite(invoiceAmountValue) || invoiceAmountValue <= 0) {
      setProjectError('Enter an invoice amount greater than zero.');
      return;
    }
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

  let savedProjectId = editingProjectId;

  if (editingProjectId) {
    const { error } = await supabase
      .from('va_projects')
      .update(projectData)
      .eq('id', editingProjectId)
      .eq('user_id', user.id);

    if (error) {
      setProjectError(error.message);
      return;
    }
  } else {
    const { data, error } = await supabase
      .from('va_projects')
      .insert({
        ...projectData,
        user_id: user.id,
      })
      .select('id')
      .single();

    if (error || !data) {
      setProjectError(error?.message || 'Project could not be saved.');
      return;
    }
    savedProjectId = data.id;
  }

  // Invoice generation is offered only when creating a new project.
  // It is saved as Draft so the user can review it before issuing.
  if (!editingProjectId && projectCreateInvoice === 'yes') {
    const invoiceAmountValue = Number(projectInvoiceAmount || amount);
    if (!projectClient.trim()) {
      setProjectError('Project saved, but an invoice was not created. Add a client name and create the invoice from Invoices & Billing.');
      await loadProjects(user.id);
      return;
    }
    if (!Number.isFinite(invoiceAmountValue) || invoiceAmountValue <= 0) {
      setProjectError('Project saved, but the invoice amount must be greater than zero. Edit the project or create its invoice from Invoices & Billing.');
      await loadProjects(user.id);
      return;
    }

    const invoiceDescriptionText = projectDescription.trim()
      ? `${projectName.trim()} — ${projectDescription.trim()}`
      : projectName.trim();

    const { data: createdInvoice, error: invoiceCreateError } = await supabase
      .from('va_invoices')
      .insert({
        user_id: user.id,
        project_id: savedProjectId,
        invoice_number: `INV-${Date.now()}`,
        client_name: projectClient.trim(),
        description: invoiceDescriptionText,
        amount: invoiceAmountValue,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: projectInvoiceDueDate || projectDueDate || null,
        payment_terms: projectInvoicePaymentTerms.trim() || null,
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (invoiceCreateError) {
      setEditingProjectId(savedProjectId);
      setProjectCreateInvoice('no');
      setProjectError(`Project was saved, but invoice creation failed: ${invoiceCreateError.message}. The project is now in edit mode; you can create its invoice from Invoices & Billing.`);
      await loadProjects(user.id);
      return;
    }

    if (createdInvoice) {
      setInvoices(prev => [createdInvoice as VAInvoice, ...prev]);
    }
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
  setInvoiceReceiptUrl('');
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
  setInvoiceReceiptUrl(invoice.receipt_url || '');
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
    receipt_url: invoiceReceiptUrl.trim() || null,
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

const handleIssueInvoice = async (invoice: VAInvoice) => {
  if (!user || invoice.status !== 'draft' || issuingInvoice) return;

  const confirmed = window.confirm(
    `Issue invoice ${invoice.invoice_number} to ${invoice.client_name}? Once issued, it will be marked as pending payment.`
  );
  if (!confirmed) return;

  setIssuingInvoice(true);
  setInvoiceError('');

  const actualIssueDate = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('va_invoices')
    .update({
      status: 'pending',
      issue_date: actualIssueDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoice.id)
    .eq('user_id', user.id)
    .eq('status', 'draft')
    .select()
    .single();

  setIssuingInvoice(false);

  if (error || !data) {
    setInvoiceError(error?.message || 'This invoice could not be issued. Refresh the invoice list and try again.');
    return;
  }

  const updatedInvoice = data as VAInvoice;
  setInvoices(previous =>
    previous.map(item => item.id === updatedInvoice.id ? updatedInvoice : item)
  );
  setViewingInvoice(updatedInvoice);
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


  const saveInvoiceProfile = async () => {
    if (!user) return;
    setInvoiceProfileSaving(true);
    setInvoiceProfileMessage('');
    const { data, error } = await supabase.auth.updateUser({
      data: {
        invoice_full_name: invoiceProfile.fullName.trim(),
        invoice_business_address: invoiceProfile.businessAddress.trim(),
        invoice_tin: invoiceProfile.tin.trim(),
        invoice_contact_number: invoiceProfile.contactNumber.trim(),
      },
    });
    setInvoiceProfileSaving(false);
    if (error) {
      setInvoiceProfileMessage(`Could not save invoice details: ${error.message}`);
      return;
    }
    if (data.user) setUser(data.user);
    setInvoiceProfileMessage('Invoice details saved successfully.');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/sign-up');
  };

useEffect(() => {
  const activeGroup =
    activeTab === 'dashboard' ? 'overview' :
    activeTab === 'work' || activeTab === 'tracker' ? 'work' :
    ['invoices', 'accounting', 'chart-of-accounts', 'journal', 'ledger', 'trial-balance', 'financial-statements', 'reports'].includes(activeTab) ? 'finance' :
    activeTab === 'documents' ? 'tax' : null;

  if (activeGroup) {
    setExpandedNavGroups((previous) => ({ ...previous, [activeGroup]: true }));
  }
}, [activeTab]);

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
    },
    monochrome: {
  bgMain: 'bg-neutral-100',
  sidebar: 'bg-black text-white border-neutral-800',
  brandBox: 'bg-neutral-900 border-neutral-700',
  brandIcon: 'bg-white text-black',
  navActive: 'bg-white text-black shadow-md',
  navInactive: 'text-neutral-300 hover:bg-neutral-800 hover:text-white',
  accentBtn: 'bg-black hover:bg-neutral-800 text-white',
  cardBg: 'bg-white',
  cardBorder: 'border-neutral-300',
  textMuted: 'text-neutral-600',
  currencyColor: 'text-neutral-900',
},
  };

const t = themes[theme] || themes.charcoal;

const displayDate = calendarDate ?? new Date(2000, 0, 1);

const currentYear = displayDate.getFullYear();
const currentMonthIndex = displayDate.getMonth();
const monthNames = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
];

const currentMonthName = monthNames[currentMonthIndex];
const firstDayIndex =
  (new Date(currentYear, currentMonthIndex, 1).getDay() + 6) % 7;

const totalDaysInMonth =
  new Date(currentYear, currentMonthIndex + 1, 0).getDate();

const calendarDays = [
  ...Array(firstDayIndex).fill(null),
  ...Array.from({ length: totalDaysInMonth }, (_, i) => i + 1)
];

// Calendar items are derived from saved tasks and projects, so status/date edits
// automatically appear after the existing Supabase loaders refresh the state.
const calendarDateKey = (year: number, monthIndex: number, day: number) =>
  `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const calendarWorkByDate = new Map<string, Array<{
  id: string;
  title: string;
  kind: 'task' | 'project';
  status: string;
  priority?: string;
}>>();

const addCalendarWork = (date: string | null, item: {
  id: string; title: string; kind: 'task' | 'project'; status: string; priority?: string;
}) => {
  if (!date) return;
  const key = date.slice(0, 10);
  const existing = calendarWorkByDate.get(key) || [];
  existing.push(item);
  calendarWorkByDate.set(key, existing);
};

tasks.filter(task => task.status !== 'completed').forEach(task => addCalendarWork(task.due_date, {
  id: task.id, title: task.title, kind: 'task', status: task.status, priority: task.priority,
}));

projects.filter(project => project.status !== 'completed').forEach(project => addCalendarWork(project.due_date, {
  id: project.id, title: project.project_name, kind: 'project', status: project.status,
}));


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
              {theme === 'monochrome' ? '◼' : theme === 'charcoal' ? '💼' : theme === 'teal' ? '🚀' : theme === 'indigo' ? '⚡' : theme === 'pink' ? '🌸' : '🌈'}
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white">VA & Freelance</h2>
              <p className="text-xs opacity-75">Management System</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'OVERVIEW', icon: '🏠', items: [{ id: 'dashboard', label: '📊 My Dashboard' }] },
              { id: 'work', label: 'WORK MANAGEMENT', icon: '🗂️', items: [
                { id: 'work', label: '📋 Work Management' },
                { id: 'tracker', label: '⏱️ Time Tracker' },
              ] },
              { id: 'finance', label: 'ACCOUNTING & FINANCE', icon: '💼', items: [
                { id: 'invoices', label: '💳 Invoices & Billing' },
                { id: 'accounting', label: '📚 Cash Book' },
                { id: 'chart-of-accounts', label: '🗃️ Chart of Accounts' },
                { id: 'journal', label: '📖 General Journal' },
                { id: 'ledger', label: '📚 General Ledger' },
                { id: 'trial-balance', label: '⚖️ Trial Balance' },
                { id: 'financial-statements', label: '📑 Financial Statements' },
                { id: 'reports', label: '📈 Reports' },
              ] },
              { id: 'tax', label: 'TAX & RECORDS', icon: '🧾', items: [{ id: 'documents', label: 'BIR Tax Center' }] },
            ].map((group) => {
              const groupIsActive = group.items.some((item) => item.id === activeTab);
              const isExpanded = Boolean(expandedNavGroups[group.id]);
              return (
                <div key={group.id}>
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedNavGroups((previous) => ({ ...previous, [group.id]: !previous[group.id] }))}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[10px] font-bold tracking-widest transition ${groupIsActive ? 'bg-white/10 text-white' : 'text-current/65 hover:bg-white/10 hover:text-white'}`}
                  >
                    <span className="flex items-center gap-2"><span>{group.icon}</span><span>{group.label}</span></span>
                    <span className="text-xs">{isExpanded ? '⌄' : '›'}</span>
                  </button>
                  {isExpanded && (
                    <div className="mt-1 ml-2 space-y-1 border-l border-current/20 pl-2">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
                            if (item.id === 'work') setWorkView('tasks');
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-left transition ${activeTab === item.id ? t.navActive : t.navInactive}`}
                        >{item.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="border-t border-current/20 pt-2 mt-3 space-y-1">
              <button type="button" onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'settings' ? t.navActive : t.navInactive}`}>⚙️ Account Settings</button>
              <button type="button" onClick={() => { setMobileMenuOpen(false); router.push('/teacher-dashboard'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${t.navInactive}`}>🎓 Switch to Teacher Dashboard</button>
            </div>
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
         
<div className="flex items-center gap-2 bg-neutral-100/80 p-1.5 rounded-xl border border-neutral-200 text-sm font-medium">

  <button
    onClick={handleToday}
    className={`px-3 py-1.5 rounded-lg transition ${
      activePeriod === 'today'
        ? `${t.accentBtn} shadow-xs`
        : 'text-neutral-600 hover:bg-white'
    }`}
  >
    Today
  </button>

  <button
    onClick={handleThisWeek}
    className={`px-3 py-1.5 rounded-lg transition ${
      activePeriod === 'week'
        ? `${t.accentBtn} shadow-xs`
        : 'text-neutral-600 hover:bg-white'
    }`}
  >
    This Week
  </button>

  <button
    onClick={handleThisMonth}
    className={`px-3 py-1.5 rounded-lg transition ${
      activePeriod === 'month'
        ? `${t.accentBtn} shadow-xs`
        : 'text-neutral-600 hover:bg-white'
    }`}
  >
    This Month
  </button>

  <button
    onClick={handleThisYear}
    className={`px-3 py-1.5 rounded-lg transition ${
      activePeriod === 'year'
        ? `${t.accentBtn} shadow-xs`
        : 'text-neutral-600 hover:bg-white'
    }`}
  >
    This Year
  </button>

</div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder} relative`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>ACTIVE CLIENTS</span><p className="text-3xl font-black text-neutral-900 mt-3">0</p><p className="text-xs text-neutral-500 font-medium mt-1">Clients</p></div>
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>TASKS DUE TODAY</span><p className="text-3xl font-black text-neutral-900 mt-3">0</p><p className="text-xs text-neutral-500 font-medium mt-1">Pending items</p></div>
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>LOGGED HOURS</span><p className="text-3xl font-black text-neutral-900 mt-3">0.0</p><p className="text-xs text-neutral-500 font-medium mt-1">Hours</p></div>
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>REVENUE & INVOICES</span><p className={`text-2xl font-black ${t.currencyColor} mt-3`}>{formatPeso(totalRecordedRevenue)}</p><p className="text-xs text-neutral-500 font-medium mt-1">{paidInvoiceCount} paid invoice{paidInvoiceCount === 1 ? '' : 's'}</p></div>
            </div>

            {/* DASHBOARD MONTHLY INCOME CHART */}
            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} mb-8`}>
              <div className="mb-6">
                <h2 className="text-lg font-black text-neutral-900">📈 Monthly Income Overview</h2>
                <p className="text-sm text-neutral-500 mt-1">Billable time-tracker earnings plus manual reportable-income entries</p>
              </div>
              <div className="flex items-end justify-between gap-3 h-56">
                {monthlyRevenueData.map((item) => (
                  <div key={item.monthKey} className="flex-1 flex flex-col items-center justify-end h-full gap-2 min-w-0">
                    <span className="text-[10px] sm:text-xs font-semibold text-neutral-700 whitespace-nowrap">
                      {formatPeso(item.revenue)}
                    </span>
                    <div className="w-full flex items-end justify-center flex-1">
                      <div
                        title={`${item.month}: ${formatPeso(item.revenue)}`}
                        className="w-full max-w-16 bg-orange-500 rounded-t-lg transition-all duration-300"
                        style={{
                          height: `${item.revenue > 0 ? Math.max((item.revenue / maxMonthlyRevenue) * 100, 5) : 0}%`,
                          minHeight: item.revenue > 0 ? '6px' : '0',
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-neutral-500">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} mb-8`}>
              <h2 className="text-base font-bold text-neutral-900 mb-4">📋 Tasks & Schedule for Today</h2>
              <div className="p-8 text-center bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl"><p className="text-sm font-medium text-neutral-500">No tasks scheduled for today yet.</p></div>
            </div>

            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
              
<div className="flex items-center justify-between mb-6">

  <h2 className="text-xl font-black text-neutral-900">
    {currentMonthName} {currentYear}
  </h2>

  <div className="flex items-center gap-2">

    <button
      onClick={handlePrevMonth}
      aria-label="Previous month"
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-neutral-200 hover:bg-neutral-100 transition text-neutral-700"
    >
      ←
    </button>

    <button
      onClick={handleNextMonth}
      aria-label="Next month"
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-neutral-200 hover:bg-neutral-100 transition text-neutral-700"
    >
      →
    </button>

  </div>

</div>

              <div className={`grid grid-cols-7 text-center font-bold text-xs ${t.textMuted} py-3 border-b border-neutral-100`}><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-4">
                {calendarDays.map((day, index) => {
                  const dateKey = day ? calendarDateKey(currentYear, currentMonthIndex, day) : '';
                  const workItems = dateKey ? (calendarWorkByDate.get(dateKey) || []) : [];
                  const isToday = day === new Date().getDate()
                    && currentMonthIndex === new Date().getMonth()
                    && currentYear === new Date().getFullYear();
                  return (
                    <div key={index} className={`min-h-28 p-2 border rounded-xl flex flex-col gap-2 ${day ? `${t.cardBorder}${t.cardBg} shadow-xs` : 'border-neutral-100 bg-neutral-50/40'}`}>
                      {day && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isToday ? 'bg-black text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-neutral-700'}`}>{day}</span>
                            {workItems.length > 0 && <span className="text-[10px] font-semibold text-neutral-500">{workItems.length} item{workItems.length === 1 ? '' : 's'}</span>}
                          </div>
                          <div className="space-y-1 overflow-hidden">
                            {workItems.slice(0, 3).map(item => (
                              <button
                                key={`${item.kind}-${item.id}`}
                                type="button"
                                title={`${item.kind === 'task' ? 'Task' : 'Project'}: ${item.title} (${item.status.replace('_', ' ')})`}
                                onClick={() => {
                                  setActiveTab('work');
                                  setWorkView(item.kind === 'project' ? 'projects' : 'tasks');
                                }}
                                className={`block w-full truncate rounded-md px-1.5 py-1 text-left text-[10px] font-semibold ${
                                  item.kind === 'project'
                                    ? 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                                    : item.status === 'in_progress'
                                      ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                }`}
                              >
                                {item.kind === 'project' ? '📁' : item.status === 'in_progress' ? '🔄' : '⏳'} {item.title}
                              </button>
                            ))}
                            {workItems.length > 3 && (
                              <button type="button" onClick={() => { setActiveTab('work'); setWorkView('tasks'); }} className="text-[10px] font-semibold text-neutral-500 hover:underline">
                                +{workItems.length - 3} more
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-500">
                <span>⏳ Pending task</span>
                <span>🔄 In-progress task</span>
                <span>📁 Active / on-hold project</span>
                <span>Completed work is hidden from the calendar.</span>
              </div>
            </div>
          </>
        )}

        {activeTab === 'work' && (
          <div className="space-y-5">
            <div className={`${t.cardBg} p-4 rounded-2xl shadow-xs border ${t.cardBorder}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div><h1 className="text-xl font-black text-neutral-900">Work Management</h1><p className="text-sm text-neutral-500 mt-1">Manage your client tasks and projects in one place.</p></div>
                <div className="inline-flex rounded-xl border border-neutral-200 bg-neutral-100 p-1">
                  <button type="button" onClick={() => { setWorkView('tasks'); setShowProjectForm(false); }} className={`px-4 py-2 rounded-lg text-sm font-semibold ${workView === 'tasks' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500'}`}>📋 Tasks</button>
                  <button type="button" onClick={() => { setWorkView('projects'); setShowTaskForm(false); }} className={`px-4 py-2 rounded-lg text-sm font-semibold ${workView === 'projects' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500'}`}>📁 Projects</button>
                </div>
              </div>
            </div>
            {workView === 'tasks' && (
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
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <label className="block text-xs font-bold text-neutral-600">Client Name</label>
                      <button
                        type="button"
                        onClick={() => {
                          setClientError('');
                          setShowAddClientForm((current) => !current);
                        }}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800"
                      >
                        + Add Client
                      </button>
                    </div>
                    <select
                      value={clientName}
                      onChange={(event) => setClientName(event.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">No client selected</option>
                      {clientName && !clients.some((client) => client.client_name === clientName) && (
                        <option value={clientName}>{clientName} (existing task)</option>
                      )}
                      {clients.map((client) => (
                        <option key={client.id} value={client.client_name}>
                          {client.company ? `${client.client_name} — ${client.company}` : client.client_name}
                        </option>
                      ))}
                    </select>
                    {clientsLoading && <p className="mt-1 text-xs text-neutral-500">Loading clients...</p>}
                    {clientError && !showAddClientForm && (
                      <p role="alert" className="mt-1 text-xs text-red-600">{clientError}</p>
                    )}
                    {showAddClientForm && (
                      <div className="mt-3 space-y-3 rounded-xl border border-amber-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-neutral-900">Add New Client</h3>
                          <button type="button" onClick={resetNewClientForm} className="text-xs font-medium text-neutral-500 hover:text-neutral-900">Close</button>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-neutral-600">Client Name *</label>
                          <input
                            required
                            value={newClientName}
                            onChange={(event) => setNewClientName(event.target.value)}
                            placeholder="Enter client name"
                            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-neutral-600">Company (optional)</label>
                            <input
                              value={newClientCompany}
                              onChange={(event) => setNewClientCompany(event.target.value)}
                              placeholder="Company name"
                              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-neutral-600">Email (optional)</label>
                            <input
                              type="email"
                              value={newClientEmail}
                              onChange={(event) => setNewClientEmail(event.target.value)}
                              placeholder="client@example.com"
                              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-semibold text-neutral-600">Phone (optional)</label>
                            <input
                              value={newClientPhone}
                              onChange={(event) => setNewClientPhone(event.target.value)}
                              placeholder="Phone number"
                              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        </div>
                        {clientError && <p role="alert" className="text-xs text-red-600">{clientError}</p>}
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={resetNewClientForm} className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700">Cancel</button>
                          <button type="button" onClick={handleAddClient} disabled={savingClient} className={`rounded-lg px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${t.accentBtn}`}>
                            {savingClient ? 'Saving...' : 'Save Client'}
                          </button>
                        </div>
                      </div>
                    )}
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

       
            {workView === 'projects' && (
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
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block text-xs font-bold text-neutral-600">Client Name</label>
              <button type="button" onClick={() => { setClientError(''); setShowAddClientForm(v => !v); }} className="text-xs font-bold text-amber-700 hover:text-amber-800">+ Add Client</button>
            </div>
            <select value={projectClient} onChange={e => setProjectClient(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm">
              <option value="">No client selected</option>
              {projectClient && !clients.some(client => client.client_name === projectClient) && <option value={projectClient}>{projectClient} (existing project)</option>}
              {clients.map(client => <option key={client.id} value={client.client_name}>{client.company ? `${client.client_name} — ${client.company}` : client.client_name}</option>)}
            </select>
            {clientsLoading && <p className="mt-1 text-xs text-neutral-500">Loading clients...</p>}
            {clientError && <p role="alert" className="mt-1 text-xs text-red-600">{clientError}</p>}
            {showAddClientForm && <div className="mt-3 space-y-3 rounded-xl border border-amber-200 bg-white p-4">
              <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-bold text-neutral-900">Add New Client</h3><button type="button" onClick={resetNewClientForm} className="text-xs text-neutral-500">Close</button></div>
              <input required value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Client name *" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
              <input type="email" value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} placeholder="Email (optional)" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
              <input value={newClientCompany} onChange={e => setNewClientCompany(e.target.value)} placeholder="Company (optional)" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
              <input value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} placeholder="Phone (optional)" className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
              <button type="button" disabled={savingClient} onClick={handleAddClient} className={`rounded-lg px-4 py-2 text-xs font-bold ${t.accentBtn}`}>{savingClient ? 'Saving...' : 'Save Client'}</button>
            </div>}
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

          {!editingProjectId && (
            <div className="md:col-span-2 rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-neutral-900">Create an invoice for this project?</p>
                  <p className="text-xs text-neutral-500 mt-1">You can choose now. If yes, a Draft invoice will be added to Invoices & Billing for review.</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setProjectCreateInvoice('yes')} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${projectCreateInvoice === 'yes' ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white text-neutral-700'}`}>Yes, create invoice</button>
                  <button type="button" onClick={() => setProjectCreateInvoice('no')} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${projectCreateInvoice === 'no' ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white text-neutral-700'}`}>No, not now</button>
                </div>
              </div>

              {projectCreateInvoice === 'yes' && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-200 pt-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Invoice Amount (₱) *</label>
                    <input type="number" min="0.01" step="0.01" required value={projectInvoiceAmount || retainerAmount} onChange={e => setProjectInvoiceAmount(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm" />
                    <p className="mt-1 text-xs text-neutral-500">Defaults to the project budget. You can change it for this invoice.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Invoice Due Date</label>
                    <input type="date" value={projectInvoiceDueDate || projectDueDate} onChange={e => setProjectInvoiceDueDate(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-600 mb-1">Custom Payment Terms</label>
                    <textarea rows={3} value={projectInvoicePaymentTerms} onChange={e => setProjectInvoicePaymentTerms(e.target.value)} placeholder="Example: 30% upon approval, 40% after the first draft, and 30% upon final delivery." className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm" />
                    <p className="mt-1 text-xs text-neutral-500">Describe your agreed payment arrangement, milestones, and due dates. This will be saved with the Draft invoice.</p>
                  </div>
                </div>
              )}
            </div>
          )}
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
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold mb-1">
              Receipt Link (optional)
            </label>
            <input
              type="url"
              value={invoiceReceiptUrl}
              onChange={e => setInvoiceReceiptUrl(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Paste a Google Drive, Dropbox, or other link to the payment receipt.
            </p>
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
                {invoice.receipt_url && (
                  <a
                    href={invoice.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex mt-2 text-sm font-semibold text-blue-600 hover:underline"
                  >
                    View Receipt ↗
                  </a>
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
  <span className="text-xs font-semibold">
    {invoice.status === 'draft'
      ? 'Draft'
      : invoice.status === 'pending'
        ? 'Issued / Unpaid'
        : invoice.status === 'paid'
          ? 'Paid'
          : 'Overdue'}
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
    <style>{`
      @media print {
        @page { size: A4 portrait; margin: 16mm; }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body * { visibility: hidden !important; }
        #invoice-print, #invoice-print * { visibility: visible !important; }
        #invoice-print {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          color: #000 !important;
          background: #fff !important;
          box-shadow: none !important;
        }
        /* Browser-generated date, title, URL and page numbers are disabled
           in the print dialog; this CSS keeps the invoice itself clean. */
        @page :first {
          margin: 16mm;
        }
        #invoice-print * {
          color: #000 !important;
          background: #fff !important;
          box-shadow: none !important;
        }
        #invoice-print .no-print { display: none !important; }
      }
    `}</style>
    <div id="invoice-print" className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">

      <div className="no-print flex justify-between items-center mb-6">
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
          {invoiceProfile.fullName || 'Your Name'}
        </h3>
        <p className="text-sm text-neutral-500">INVOICE</p>
        <div className="mt-2 space-y-0.5 text-sm text-neutral-700">
          {invoiceProfile.businessAddress && <p className="whitespace-pre-wrap">{invoiceProfile.businessAddress}</p>}
          {invoiceProfile.tin && <p>TIN: {invoiceProfile.tin}</p>}
          {invoiceProfile.contactNumber && <p>Contact: {invoiceProfile.contactNumber}</p>}
        </div>
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

        <div>
          <p className="text-xs text-neutral-500">Payment Receipt</p>
          {viewingInvoice.receipt_url ? (
            <a
              href={viewingInvoice.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:underline"
            >
              Open receipt link ↗
            </a>
          ) : (
            <p className="text-neutral-500">No receipt link added</p>
          )}
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

        {viewingInvoice.payment_terms && (
          <div className="border-t border-neutral-200 pt-4">
            <p className="text-xs text-neutral-500 mb-1">Payment Terms</p>
            <p className="whitespace-pre-wrap">{viewingInvoice.payment_terms}</p>
          </div>
        )}

        <div className="border-t border-neutral-200 pt-4">
          <p className="text-xs text-neutral-500">Total Amount</p>
          <p className="text-3xl font-black text-amber-600">
          {formatPeso(viewingInvoice.amount)}
          </p>
        </div>

        <div>
          <p className="text-xs text-neutral-500">Payment Status</p>
          <p className="font-bold">
            {viewingInvoice.status === 'draft'
              ? 'Draft — not yet issued'
              : viewingInvoice.status === 'pending'
                ? 'Issued — awaiting payment'
                : viewingInvoice.status === 'paid'
                  ? 'Paid'
                  : 'Overdue'}
          </p>
        </div>
      </div>

      <div className="no-print flex flex-wrap justify-end gap-2 mt-6">
        {viewingInvoice.status === 'draft' && (
          <button
            type="button"
            disabled={issuingInvoice}
            onClick={() => handleIssueInvoice(viewingInvoice)}
            className="rounded-xl bg-black px-5 py-2 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {issuingInvoice ? 'Issuing...' : 'Issue Invoice'}
          </button>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl border border-neutral-300 bg-white px-5 py-2 text-sm font-bold text-neutral-900 hover:bg-neutral-50"
        >
          Print / Save PDF
        </button>
        <button
          type="button"
          onClick={() => setViewingInvoice(null)}
          className="rounded-xl bg-amber-600 px-5 py-2 text-sm font-bold text-white hover:bg-amber-700"
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}

     
{activeTab === 'accounting' && (
  <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
    <style>{`
      @media print {
        body * { visibility: hidden !important; }
        #cash-book-print, #cash-book-print * { visibility: visible !important; }
        #cash-book-print { position: absolute; inset: 0; width: 100%; padding: 10mm; color: #000 !important; background: #fff !important; }
        #cash-book-print * { color: #000 !important; background: #fff !important; box-shadow: none !important; }
        #cash-book-print .no-print { display: none !important; }
        #cash-book-print table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        #cash-book-print th, #cash-book-print td { border: 1px solid #000 !important; padding: 5px; color: #000 !important; }
        @page { size: A4 landscape; margin: 10mm; }
      }
    `}</style>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
      <div>
        <h1 className="text-2xl font-black text-neutral-900">Cash Receipts and Disbursements</h1>
        <p className="text-sm text-neutral-500 mt-1">Record cash actually received and paid, with links to supporting documents.</p>
      </div>
      <div className="no-print flex gap-2">
        <button type="button" onClick={() => window.print()} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-bold">Print / Save PDF</button>
        <button type="button" onClick={() => { resetCashTransactionForm(); setShowCashTransactionForm(true); }} className={`rounded-xl px-4 py-2 text-sm font-bold ${t.accentBtn}`}>+ Add Entry</button>
      </div>
    </div>
    <div className="no-print flex items-center gap-3 mb-5">
      <label className="text-xs font-bold text-neutral-600">REPORTING YEAR</label>
      <select value={cashRegisterYear} onChange={e => setCashRegisterYear(Number(e.target.value))} className="rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm">
        {Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => <option key={year} value={year}>{year}</option>)}
      </select>
    </div>

    {showCashTransactionForm && (
      <form onSubmit={saveCashTransaction} className="no-print rounded-2xl border border-neutral-300 bg-neutral-50 p-5 mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold">{editingCashTransactionId ? 'Edit entry' : 'Add cash book entry'}</h2>
          <button type="button" onClick={resetCashTransactionForm} className="text-sm">Close</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-xs font-bold">ENTRY TYPE *
            <select value={cashTransactionType} onChange={e => { const type = e.target.value as 'receipt' | 'disbursement'; setCashTransactionType(type); setCashTransactionCategory(type === 'receipt' ? 'Professional fees' : 'Office and operating expenses'); }} className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-normal">
              <option value="receipt">Cash receipt – money received</option><option value="disbursement">Cash disbursement – money paid</option>
            </select>
          </label>
          <label className="text-xs font-bold">DATE CASH WAS {cashTransactionType === 'receipt' ? 'RECEIVED' : 'PAID'} *
            <input required type="date" value={cashTransactionDate} onChange={e => setCashTransactionDate(e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-normal"/>
          </label>
          <label className="text-xs font-bold md:col-span-2">DESCRIPTION / PARTICULARS *
            <input required value={cashTransactionDescription} onChange={e => setCashTransactionDescription(e.target.value)} placeholder="Describe the receipt or payment" className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-normal"/>
          </label>
          <label className="text-xs font-bold">CLIENT / PAYEE / SOURCE
            <input value={cashTransactionCounterparty} onChange={e => setCashTransactionCounterparty(e.target.value)} placeholder="Client, supplier, or other party" className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-normal"/>
          </label>
          <label className="text-xs font-bold">ACCOUNT CATEGORY
            <select value={cashTransactionCategory} onChange={e => setCashTransactionCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-normal">
              {cashTransactionType === 'receipt' ? <><option>Professional fees</option><option>Other business receipts</option><option>Refund received</option><option>Owner contribution</option><option>Other receipt</option></> : <><option>Office and operating expenses</option><option>Internet and communications</option><option>Transportation and travel</option><option>Supplies</option><option>Professional fees paid</option><option>Taxes and licenses</option><option>Bank charges</option><option>Equipment and assets</option><option>Owner withdrawal</option><option>Other disbursement</option></>}
            </select>
          </label>
          <label className="text-xs font-bold">AMOUNT (₱) *
            <input required inputMode="decimal" value={cashTransactionAmount} onChange={e => setCashTransactionAmount(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="0.00" className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-normal"/>
          </label>
          <label className="text-xs font-bold">PAYMENT METHOD
            <select value={cashTransactionPaymentMethod} onChange={e => setCashTransactionPaymentMethod(e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-normal">
              <option>Bank transfer</option><option>Cash</option><option>E-wallet</option><option>Check</option><option>Card</option><option>Other</option>
            </select>
          </label>
          <label className="text-xs font-bold">REFERENCE NUMBER
            <input value={cashTransactionReference} onChange={e => setCashTransactionReference(e.target.value)} placeholder="Bank / check reference" className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-normal"/>
          </label>
          <label className="text-xs font-bold">NOTES / SUPPORTING DOCUMENT LINK
            <input type="url" value={cashTransactionNotesUrl} onChange={e => setCashTransactionNotesUrl(e.target.value)} placeholder="https://drive.google.com/..." className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-normal"/>
          </label>
        </div>
        {cashTransactionError && <p className="text-sm text-red-700">{cashTransactionError}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={resetCashTransactionForm} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm">Cancel</button>
          <button disabled={cashTransactionSaving} className={`rounded-xl px-5 py-2 text-sm font-bold ${t.accentBtn} disabled:opacity-50`}>{cashTransactionSaving ? 'Saving...' : editingCashTransactionId ? 'Update Entry' : 'Save Entry'}</button>
        </div>
      </form>
    )}
    {cashTransactionError && !showCashTransactionForm && <p className="no-print text-sm text-red-700 mb-3">{cashTransactionError}</p>}
    {cashTransactionsLoading && <p className="text-sm text-neutral-500">Loading entries...</p>}

    {(() => {
      // Bring existing manual BIR income records into the Cash Book as imported receipts.
      // They remain owned by the BIR Tax Center, so they are not duplicated in Supabase.
      const manualReceipts = birAdjustments
        .filter(item => cashRegisterYear > 0 && item.income_date?.slice(0, 4) === String(cashRegisterYear))
        .map(item => ({
          id: `manual-${item.id}`,
          transaction_date: item.income_date,
          transaction_type: 'receipt' as const,
          description: item.description,
          counterparty: item.source || 'Manual income entry',
          category: 'Manual income (BIR Tax Center)',
          amount: Number(item.amount) || 0,
          payment_method: null,
          reference_no: null,
          notes_url: item.document_url,
          isManual: true,
          sourceId: item.id,
        }));
      const cashRows = cashTransactions
        .filter(item => cashRegisterYear > 0 && item.transaction_date.slice(0, 4) === String(cashRegisterYear))
        .map(item => ({ ...item, isManual: false as const, sourceId: item.id }));
      const entries = [...cashRows, ...manualReceipts]
        .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
      const receipts = entries.filter(item => item.transaction_type === 'receipt').reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const payments = entries.filter(item => item.transaction_type === 'disbursement').reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return <div id="cash-book-print">
        <div className="hidden print:block text-center mb-5">
          <h1 className="text-lg font-bold">CASH RECEIPTS AND DISBURSEMENTS REGISTER</h1>
          <p>Individual Professional / Self-Employed – Non-VAT | Calendar Year {cashRegisterYear}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="rounded-xl border border-neutral-300 p-4"><p className="text-xs font-bold text-neutral-500">TOTAL RECEIPTS</p><p className="text-xl font-black">{formatPeso(receipts)}</p></div>
          <div className="rounded-xl border border-neutral-300 p-4"><p className="text-xs font-bold text-neutral-500">TOTAL DISBURSEMENTS</p><p className="text-xl font-black">{formatPeso(payments)}</p></div>
          <div className="rounded-xl border border-neutral-300 p-4"><p className="text-xs font-bold text-neutral-500">NET CASH MOVEMENT</p><p className="text-xl font-black">{formatPeso(receipts - payments)}</p></div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-neutral-300">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-neutral-100"><tr><th className="p-3">Date</th><th className="p-3">Type</th><th className="p-3">Particulars</th><th className="p-3">Payee / Source</th><th className="p-3">Category</th><th className="p-3 text-right">Receipts</th><th className="p-3 text-right">Disbursements</th><th className="p-3">Notes link</th><th className="p-3 no-print">Actions</th></tr></thead>
            <tbody>{entries.length === 0 ? <tr><td colSpan={9} className="p-8 text-center text-neutral-500">No entries recorded for {cashRegisterYear}.</td></tr> : entries.map(item => <tr key={item.id} className="border-t border-neutral-200">
              <td className="p-3 whitespace-nowrap">{item.transaction_date}</td><td className="p-3">{item.transaction_type === 'receipt' ? 'Receipt' : 'Disbursement'}{item.isManual && <span className="block text-xs text-neutral-500">Imported</span>}</td><td className="p-3">{item.description}</td><td className="p-3">{item.counterparty || '—'}</td><td className="p-3">{item.category}</td>
              <td className="p-3 text-right">{item.transaction_type === 'receipt' ? formatPeso(item.amount) : '—'}</td><td className="p-3 text-right">{item.transaction_type === 'disbursement' ? formatPeso(item.amount) : '—'}</td>
              <td className="p-3">{item.notes_url ? <a href={item.notes_url} target="_blank" rel="noopener noreferrer" className="underline">Supporting document</a> : '—'}</td>
              <td className="p-3 no-print whitespace-nowrap">{item.isManual ? <button type="button" onClick={() => setActiveTab('documents')} className="underline">Manage in BIR Tax Center</button> : <><button type="button" onClick={() => openEditCashTransaction(item as VACashTransaction)} className="mr-3 underline">Edit</button><button type="button" onClick={() => deleteCashTransaction(item.id)} className="text-red-700 underline">Delete</button></>}</td>
            </tr>)}</tbody>
            <tfoot className="border-t-2 border-black font-bold"><tr><td colSpan={5} className="p-3 text-right">TOTAL</td><td className="p-3 text-right">{formatPeso(receipts)}</td><td className="p-3 text-right">{formatPeso(payments)}</td><td colSpan={2}></td></tr></tfoot>
          </table>
        </div>
        <p className="mt-3 text-xs text-neutral-600">Manual income entries from the BIR Tax Center are included automatically as cash receipts. Do not enter the same receipt again here. To edit or delete an imported manual entry, use the BIR Tax Center. Keep original invoices, receipts, bank statements, and supporting evidence.</p>
        <p className="mt-2 text-xs text-neutral-500">Recordkeeping aid only. Confirm accounting and tax classifications with your accountant or tax professional.</p>
      </div>;
    })()}
  </div>
)}



{activeTab === 'chart-of-accounts' && (
  <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div><h1 className="text-2xl font-black text-neutral-900">🗃️ Chart of Accounts</h1><p className="text-sm text-neutral-500">Manage the accounts used by your General Journal.</p></div>
      <button type="button" onClick={() => { resetChartAccountForm(); setShowChartAccountForm(true); }} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${t.accentBtn}`}>+ Add Account</button>
    </div>
    {chartAccountsError && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{chartAccountsError}</p>}
    {showChartAccountForm && <form onSubmit={saveChartAccount} className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-4">
      <h2 className="font-bold">{editingChartAccountId ? 'Edit Account' : 'Add Account'}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm font-semibold">Account Code<input value={chartAccountCode} onChange={e => setChartAccountCode(e.target.value)} required maxLength={20} className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 font-normal" placeholder="e.g. 1010" /></label>
        <label className="text-sm font-semibold">Account Name<input value={chartAccountName} onChange={e => setChartAccountName(e.target.value)} required maxLength={120} className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 font-normal" placeholder="e.g. Cash in Bank" /></label>
        <label className="text-sm font-semibold">Account Type<select value={chartAccountType} onChange={e => { const v = e.target.value as VAChartAccount['account_type']; setChartAccountType(v); setChartAccountNormalBalance(['Asset','Expense'].includes(v) ? 'Debit' : 'Credit'); }} className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 font-normal">{(['Asset','Liability','Equity','Income','Expense'] as const).map(v => <option key={v}>{v}</option>)}</select></label>
        <label className="text-sm font-semibold">Normal Balance<select value={chartAccountNormalBalance} onChange={e => setChartAccountNormalBalance(e.target.value as VAChartAccount['normal_balance'])} className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 font-normal"><option>Debit</option><option>Credit</option></select></label>
        <label className="text-sm font-semibold sm:col-span-2">Description (optional)<input value={chartAccountDescription} onChange={e => setChartAccountDescription(e.target.value)} maxLength={300} className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 font-normal" /></label>
      </div>
      <div className="flex justify-end gap-2"><button type="button" onClick={resetChartAccountForm} className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm">Cancel</button><button type="submit" disabled={chartAccountSaving} className={`rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50 ${t.accentBtn}`}>{chartAccountSaving ? 'Saving...' : 'Save Account'}</button></div>
    </form>}
    {chartAccountsLoading ? <p className="py-10 text-center text-sm text-neutral-500">Loading accounts...</p> : chartAccounts.length === 0 ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Run the Supabase Chart of Accounts migration, then refresh this page. Existing journal account choices remain available until the catalog is populated.</div> : (
      <div className="overflow-x-auto rounded-xl border border-neutral-200"><table className="w-full min-w-[760px] text-sm">
        <thead className="bg-neutral-100 text-neutral-700"><tr><th className="p-3 text-left">Code</th><th className="p-3 text-left">Account Name</th><th className="p-3 text-left">Type</th><th className="p-3 text-left">Normal Balance</th><th className="p-3 text-left">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
        <tbody>{chartAccounts.map(a => <tr key={a.id} className="border-t border-neutral-200"><td className="p-3">{a.account_code}</td><td className="p-3 font-medium">{a.account_name}{a.description && <p className="mt-1 text-xs font-normal text-neutral-500">{a.description}</p>}</td><td className="p-3">{a.account_type}</td><td className="p-3">{a.normal_balance}</td><td className="p-3">{a.is_active ? 'Active' : 'Inactive'}</td><td className="p-3 text-right whitespace-nowrap"><button type="button" onClick={() => editChartAccount(a)} className="mr-3 underline">Edit</button><button type="button" onClick={() => toggleChartAccount(a)} className="underline">{a.is_active ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody>
      </table></div>
    )}
    <p className="mt-4 text-xs text-neutral-500">Historical journal entries are not changed. Deactivated accounts remain in prior records but are removed from new journal selections.</p>
  </div>
)}

{activeTab === 'journal' && (
  <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
    <style jsx global>{`
      @media print {
        body * { visibility: hidden !important; }
        #general-journal-print, #general-journal-print * { visibility: visible !important; }
        #general-journal-print { position: absolute; inset: 0; width: 100%; padding: 10mm; color: #000 !important; background: #fff !important; }
        #general-journal-print * { color: #000 !important; background: #fff !important; box-shadow: none !important; }
        #general-journal-print .no-print { display: none !important; }
        #general-journal-print table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        #general-journal-print th, #general-journal-print td { border: 1px solid #000 !important; padding: 5px; }
      }
    `}</style>
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl font-black text-neutral-900">📖 General Journal</h1>
        <p className="text-sm text-neutral-500 mt-1">Record properly supported adjusting, opening, and other non-cash journal entries.</p>
      </div>
      <div className="flex gap-2 no-print">
        <button type="button" onClick={() => window.print()} className="rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-bold">Print / Save PDF</button>
        <button type="button" onClick={() => { resetJournalForm(); setShowJournalForm(true); }} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${t.accentBtn}`}>+ Add Journal Entry</button>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-3 mb-5 no-print">
      <label className="text-xs font-bold text-neutral-600">REPORTING YEAR
        <select value={journalYear} onChange={e => setJournalYear(Number(e.target.value))} className="ml-3 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal">
          {[...new Set([
            new Date().getFullYear(),
            ...journalEntries.map(entry => Number(entry.entry_date.slice(0, 4))),
            ...birAdjustments.map(entry => Number(entry.income_date.slice(0, 4))),
            ...cashTransactions.map(entry => Number(entry.transaction_date.slice(0, 4))),
          ])].filter(year => Number.isFinite(year) && year > 1900).sort((a, b) => b - a).map(year => <option key={year} value={year}>{year}</option>)}
        </select>
      </label>
    </div>
    {showJournalForm && (
      <form onSubmit={saveJournalEntry} className="rounded-2xl border border-neutral-300 p-5 mb-5 no-print">
        <div className="flex justify-between items-center mb-4"><h2 className="font-bold">{editingJournalId ? 'Edit journal entry' : 'New journal entry'}</h2><button type="button" onClick={resetJournalForm} className="text-sm text-neutral-500">Close</button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-xs font-bold">ENTRY DATE *
            <input required type="date" value={journalDate} onChange={e => setJournalDate(e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-normal"/>
          </label>
          <label className="text-xs font-bold">REFERENCE / ENTRY NUMBER
            <input value={journalNumber} onChange={e => setJournalNumber(e.target.value)} placeholder="e.g. GJ-2026-001" className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-normal"/>
          </label>
          <label className="text-xs font-bold md:col-span-2">PARTICULARS / EXPLANATION *
            <input required value={journalDescription} onChange={e => setJournalDescription(e.target.value)} placeholder="Explain the transaction and why this journal entry is needed" className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-normal"/>
          </label>
          <label className="text-xs font-bold">DEBIT ACCOUNT *
            <select value={journalDebitAccount} onChange={e => setJournalDebitAccount(e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-normal">{activeJournalAccountNames.map(account => <option key={account}>{account}</option>)}</select>
          </label>
          <label className="text-xs font-bold">CREDIT ACCOUNT *
            <select value={journalCreditAccount} onChange={e => setJournalCreditAccount(e.target.value)} className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-normal">{activeJournalAccountNames.map(account => <option key={account}>{account}</option>)}</select>
          </label>
          <label className="text-xs font-bold">AMOUNT (₱) *
            <input required inputMode="decimal" value={journalAmount} onChange={e => setJournalAmount(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="0.00" className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-normal"/>
          </label>
          <label className="text-xs font-bold">NOTES / SUPPORTING DOCUMENT LINK
            <input type="url" value={journalNotesUrl} onChange={e => setJournalNotesUrl(e.target.value)} placeholder="https://drive.google.com/..." className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-sm font-normal"/>
          </label>
        </div>
        <p className="text-xs text-neutral-500 mt-3">Each entry records equal debit and credit amounts. Use this form for entries that are not already recorded in the Cash Book. Avoid duplicating cash receipts or payments.</p>
        {journalError && <p className="text-sm text-red-700 mt-3">{journalError}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={resetJournalForm} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm">Cancel</button>
          <button disabled={journalSaving} className={`rounded-xl px-5 py-2 text-sm font-bold ${t.accentBtn} disabled:opacity-50`}>{journalSaving ? 'Saving...' : editingJournalId ? 'Update Entry' : 'Save Entry'}</button>
        </div>
      </form>
    )}
    {journalError && !showJournalForm && <p className="text-sm text-red-700 mb-3">{journalError}</p>}
    {journalLoading ? <p className="text-sm text-neutral-500">Loading journal entries...</p> : (
      <div id="general-journal-print">
        <div className="hidden print:block text-center mb-5">
          <h1 className="text-lg font-bold">GENERAL JOURNAL</h1>
          <p>Individual Professional / Self-Employed – Non-VAT | Calendar Year {journalYear}</p>
        </div>
        {(() => {
          // Historical source transactions are displayed as imported journal lines.
          // They are NOT inserted into va_general_journal, preventing duplicate postings.
          const savedRows = journalEntries
            .filter(entry => entry.entry_date.slice(0, 4) === String(journalYear))
            .map(entry => ({ ...entry, isImported: false as const, sourceType: 'journal' as const }));

          const importedIncomeRows = birAdjustments
            .filter(entry => entry.income_date.slice(0, 4) === String(journalYear))
            .map(entry => ({
              id: `bir-${entry.id}`,
              user_id: entry.user_id,
              entry_date: entry.income_date,
              entry_number: `BIR-${entry.tax_year}-${entry.id.slice(0, 6)}`,
              description: entry.description,
              debit_account: 'Cash in Bank',
              credit_account: 'Professional Fees Income',
              amount: Number(entry.amount) || 0,
              notes_url: entry.document_url,
              created_at: entry.created_at,
              isImported: true as const,
              sourceType: 'bir' as const,
            }));

          const importedCashRows = cashTransactions
            .filter(entry => entry.transaction_date.slice(0, 4) === String(journalYear))
            .map(entry => {
              const isReceipt = entry.transaction_type === 'receipt';
              const cashAccount = entry.payment_method?.toLowerCase() === 'cash' ? 'Cash on Hand' : 'Cash in Bank';
              const expenseAccount = activeJournalAccountNames.includes(entry.category) ? entry.category : 'Other Operating Expense';
              return {
                id: `cash-${entry.id}`,
                user_id: entry.user_id,
                entry_date: entry.transaction_date,
                entry_number: entry.reference_no || `CASH-${entry.id.slice(0, 6)}`,
                description: entry.description,
                debit_account: isReceipt ? cashAccount : expenseAccount,
                credit_account: isReceipt ? 'Professional Fees Income' : cashAccount,
                amount: Number(entry.amount) || 0,
                notes_url: entry.notes_url,
                created_at: entry.created_at,
                isImported: true as const,
                sourceType: 'cash' as const,
              };
            });

          const rows = [...savedRows, ...importedIncomeRows, ...importedCashRows]
            .sort((a, b) => b.entry_date.localeCompare(a.entry_date));
          const total = rows.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
          return <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="rounded-xl border border-neutral-300 p-4"><p className="text-xs font-bold text-neutral-500">JOURNAL ENTRIES</p><p className="text-xl font-black">{rows.length}</p></div>
              <div className="rounded-xl border border-neutral-300 p-4"><p className="text-xs font-bold text-neutral-500">TOTAL DEBITS</p><p className="text-xl font-black">{formatPeso(total)}</p></div>
              <div className="rounded-xl border border-neutral-300 p-4"><p className="text-xs font-bold text-neutral-500">TOTAL CREDITS</p><p className="text-xl font-black">{formatPeso(total)}</p></div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-neutral-300">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="p-3 w-[130px]">Date</th>
                    <th className="p-3">Particulars</th>
                    <th className="p-3">Ref. No.</th>
                    <th className="p-3 text-right">Debit (₱)</th>
                    <th className="p-3 text-right">Credit (₱)</th>
                    <th className="p-3 no-print">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-neutral-500">No journal entries recorded for {journalYear}.</td></tr>
                  ) : rows.map(entry => (
                    <Fragment key={entry.id}>
                      <tr className="border-t border-neutral-200">
                        <td rowSpan={2} className="p-3 align-top whitespace-nowrap">{entry.entry_date}</td>
                        <td className="p-3 font-medium">{entry.debit_account}</td>
                        <td rowSpan={2} className="p-3 align-top">{entry.entry_number || '—'}</td>
                        <td className="p-3 text-right align-top">{formatPeso(entry.amount)}</td>
                        <td className="p-3 text-right align-top">—</td>
                        <td rowSpan={2} className="p-3 no-print align-top whitespace-nowrap">
                          {entry.isImported ? (
                            <span className="text-xs text-neutral-500">Imported from {entry.sourceType === 'bir' ? 'BIR Tax Center' : 'Cash Book'}</span>
                          ) : (
                            <>
                              <button type="button" onClick={() => editJournalEntry(entry)} className="mr-3 underline">Edit</button>
                              <button type="button" onClick={() => deleteJournalEntry(entry.id)} className="text-red-700 underline">Delete</button>
                            </>
                          )}
                        </td>
                      </tr>
                      <tr className="border-b border-neutral-200">
                        <td className="py-2 pl-9 pr-3 text-neutral-700">{entry.credit_account}</td>
                        <td className="p-3 text-right">—</td>
                        <td className="p-3 text-right">{formatPeso(entry.amount)}</td>
                      </tr>
                      <tr className="border-b border-neutral-200">
                        <td></td>
                        <td colSpan={4} className="px-3 pb-3 pt-0 text-xs text-neutral-500">
                          {entry.description}
                          {entry.notes_url && <span> · <a href={entry.notes_url} target="_blank" rel="noopener noreferrer" className="underline">Supporting document</a></span>}
                        </td>
                        <td className="no-print"></td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-black font-bold">
                  <tr>
                    <td colSpan={3} className="p-3 text-right">TOTAL</td>
                    <td className="p-3 text-right">{formatPeso(total)}</td>
                    <td className="p-3 text-right">{formatPeso(total)}</td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>;
        })()}
        <p className="mt-3 text-xs text-neutral-600">Historical BIR income and Cash Book transactions are displayed as imported journal lines using the original transaction dates. Imported lines remain linked to their source records and are not saved again in the General Journal, preventing duplicate entries. Account classifications are provisional; review cash/bank accounts and expense categories before relying on these lines for formal accounting reports.</p>
      </div>
    )}
  </div>
)}


{activeTab === 'ledger' && (
  <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
    <style jsx global>{`
      @media print {
        body * { visibility: hidden !important; }
        #general-ledger-print, #general-ledger-print * { visibility: visible !important; }
        #general-ledger-print { position: absolute; inset: 0; width: 100%; padding: 10mm; color: #000 !important; background: #fff !important; }
        #general-ledger-print * { color: #000 !important; background: #fff !important; box-shadow: none !important; }
        #general-ledger-print .no-print { display: none !important; }
        #general-ledger-print table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        #general-ledger-print th, #general-ledger-print td { border: 1px solid #000 !important; padding: 5px; }
      }
    `}</style>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 no-print">
      <div>
        <h1 className="text-2xl font-black text-neutral-900">📚 General Ledger</h1>
        <p className="text-sm text-neutral-500">Transactions grouped by account, with running balances.</p>
      </div>
      <div className="flex gap-2">
        <select value={journalYear} onChange={e => setJournalYear(Number(e.target.value))} className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm">
          {Array.from({ length: Math.max(8, new Date().getFullYear() - 2025 + 1) }, (_, i) => new Date().getFullYear() - i).map(year => <option key={year} value={year}>{year}</option>)}
          {!Array.from({ length: Math.max(8, new Date().getFullYear() - 2025 + 1) }, (_, i) => new Date().getFullYear() - i).includes(2025) && <option value={2025}>2025</option>}
        </select>
        <button type="button" onClick={() => window.print()} className={`rounded-xl px-4 py-2 text-sm font-bold ${t.accentBtn}`}>Print / Save PDF</button>
      </div>
    </div>
    <div id="general-ledger-print">
      <div className="hidden print:block text-center mb-5">
        <h1 className="text-lg font-bold">GENERAL LEDGER</h1>
        <p>Individual Professional / Self-Employed – Non-VAT | Calendar Year {journalYear}</p>
      </div>
      {(() => {
        type LedgerLine = { id: string; date: string; description: string; account: string; debit: number; credit: number; ref: string; imported: boolean };
        const lines: LedgerLine[] = [];
        journalEntries.filter(e => e.entry_date.slice(0, 4) === String(journalYear)).forEach(e => {
          lines.push({ id: `${e.id}-dr`, date: e.entry_date, description: e.description, account: e.debit_account, debit: Number(e.amount) || 0, credit: 0, ref: e.entry_number || '', imported: false });
          lines.push({ id: `${e.id}-cr`, date: e.entry_date, description: e.description, account: e.credit_account, debit: 0, credit: Number(e.amount) || 0, ref: e.entry_number || '', imported: false });
        });
        birAdjustments.filter(e => e.income_date.slice(0, 4) === String(journalYear)).forEach(e => {
          const amount = Number(e.amount) || 0;
          lines.push({ id: `bir-${e.id}-dr`, date: e.income_date, description: e.description, account: 'Cash in Bank', debit: amount, credit: 0, ref: `BIR-${e.tax_year}`, imported: true });
          lines.push({ id: `bir-${e.id}-cr`, date: e.income_date, description: e.description, account: 'Professional Fees Income', debit: 0, credit: amount, ref: `BIR-${e.tax_year}`, imported: true });
        });
        cashTransactions.filter(e => e.transaction_date.slice(0, 4) === String(journalYear)).forEach(e => {
          const amount = Number(e.amount) || 0;
          const cashAccount = e.payment_method?.toLowerCase() === 'cash' ? 'Cash on Hand' : 'Cash in Bank';
          const expenseAccount = activeJournalAccountNames.includes(e.category) ? e.category : 'Other Operating Expense';
          const isReceipt = e.transaction_type === 'receipt';
          const debitAccount = isReceipt ? cashAccount : expenseAccount;
          const creditAccount = isReceipt ? 'Professional Fees Income' : cashAccount;
          lines.push({ id: `cash-${e.id}-dr`, date: e.transaction_date, description: e.description, account: debitAccount, debit: amount, credit: 0, ref: e.reference_no || '', imported: true });
          lines.push({ id: `cash-${e.id}-cr`, date: e.transaction_date, description: e.description, account: creditAccount, debit: 0, credit: amount, ref: e.reference_no || '', imported: true });
        });
        const accounts = Array.from(new Set([...activeJournalAccountNames, ...lines.map(line => line.account)])).sort();
        const money = (n: number) => formatPeso(Math.abs(n));
        return accounts.map(account => {
          const accountLines = lines.filter(line => line.account === account).sort((a, b) => a.date.localeCompare(b.date));
          if (!accountLines.length) return null;
          let debitBalance = 0;
          let creditBalance = 0;
          const normalDebit = ['Cash on Hand','Cash in Bank','Accounts Receivable','Computer and Equipment','Office Supplies Expense','Internet and Communications Expense','Utilities Expense','Transportation Expense','Software and Subscriptions Expense','Repairs and Maintenance Expense','Taxes and Licenses Expense','Bank Charges Expense','Depreciation Expense','Other Operating Expense','Owner\'s Drawings'].includes(account);
          return <section key={account} className="mb-7 break-inside-avoid">
            <h2 className="font-bold text-base border-b-2 border-black pb-1 mb-2">ACCOUNT: {account}</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead><tr><th>Date</th><th>Particulars</th><th>Ref.</th><th className="text-right">Debit (₱)</th><th className="text-right">Credit (₱)</th><th className="text-right">Balance (₱)</th></tr></thead>
                <tbody>{accountLines.map(line => {
                  debitBalance += line.debit;
                  creditBalance += line.credit;
                  const balance = normalDebit ? debitBalance - creditBalance : creditBalance - debitBalance;
                  return <tr key={line.id}>
                    <td className="whitespace-nowrap">{line.date}</td>
                    <td>{line.description}{line.imported && <span className="block text-xs">Imported source record</span>}</td>
                    <td>{line.ref || '—'}</td>
                    <td className="text-right">{line.debit ? money(line.debit) : '—'}</td>
                    <td className="text-right">{line.credit ? money(line.credit) : '—'}</td>
                    <td className="text-right">{money(Math.abs(balance))} {balance < 0 ? (normalDebit ? 'Cr' : 'Dr') : (normalDebit ? 'Dr' : 'Cr')}</td>
                  </tr>;
                })}</tbody>
                <tfoot><tr className="font-bold"><td colSpan={3}>ACCOUNT TOTAL</td><td className="text-right">{money(accountLines.reduce((sum, line) => sum + line.debit, 0))}</td><td className="text-right">{money(accountLines.reduce((sum, line) => sum + line.credit, 0))}</td><td className="text-right">{money(Math.abs(normalDebit ? debitBalance - creditBalance : creditBalance - debitBalance))}</td></tr></tfoot>
              </table>
            </div>
          </section>;
        });
      })()}
      <p className="mt-4 text-xs text-neutral-600">This ledger is generated from saved General Journal entries and linked historical source records. Imported cash and BIR records are shown for review and are not duplicated in the journal database. Verify account classifications and opening balances before relying on this report for formal financial statements or tax filings.</p>
    </div>
  </div>
)}


{activeTab === 'trial-balance' && (
  <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
    <style jsx global>{`
      @media print {
        body * { visibility: hidden !important; }
        #trial-balance-print, #trial-balance-print * { visibility: visible !important; }
        #trial-balance-print { position: absolute; inset: 0; width: 100%; padding: 10mm; color: #000 !important; background: #fff !important; }
        #trial-balance-print * { color: #000 !important; background: #fff !important; box-shadow: none !important; }
        #trial-balance-print .no-print { display: none !important; }
        #trial-balance-print table { width: 100%; border-collapse: collapse; font-size: 10pt; }
        #trial-balance-print th, #trial-balance-print td { border: 1px solid #000 !important; padding: 6px; }
      }
    `}</style>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 no-print">
      <div>
        <h1 className="text-2xl font-black text-neutral-900">⚖️ Trial Balance</h1>
        <p className="text-sm text-neutral-500">Summary of debit and credit balances by account.</p>
      </div>
      <div className="flex gap-2">
        <select value={journalYear} onChange={e => setJournalYear(Number(e.target.value))} className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm">
          {Array.from({ length: Math.max(8, new Date().getFullYear() - 2025 + 1) }, (_, i) => new Date().getFullYear() - i).map(year => <option key={year} value={year}>{year}</option>)}
          {!Array.from({ length: Math.max(8, new Date().getFullYear() - 2025 + 1) }, (_, i) => new Date().getFullYear() - i).includes(2025) && <option value={2025}>2025</option>}
        </select>
        <button type="button" onClick={() => window.print()} className={`rounded-xl px-4 py-2 text-sm font-bold ${t.accentBtn}`}>Print / Save PDF</button>
      </div>
    </div>
    <div id="trial-balance-print">
      <div className="hidden print:block text-center mb-5">
        <h1 className="text-lg font-bold">TRIAL BALANCE</h1>
        <p>Individual Professional / Self-Employed – Non-VAT</p>
        <p>For the year ended December 31, {journalYear}</p>
      </div>
      {(() => {
        type TBLine = { date: string; account: string; debit: number; credit: number };
        const lines: TBLine[] = [];
        journalEntries.filter(e => e.entry_date.slice(0, 4) === String(journalYear)).forEach(e => {
          const amount = Number(e.amount) || 0;
          lines.push({ date: e.entry_date, account: e.debit_account, debit: amount, credit: 0 });
          lines.push({ date: e.entry_date, account: e.credit_account, debit: 0, credit: amount });
        });
        birAdjustments.filter(e => e.income_date.slice(0, 4) === String(journalYear)).forEach(e => {
          const amount = Number(e.amount) || 0;
          lines.push({ date: e.income_date, account: 'Cash in Bank', debit: amount, credit: 0 });
          lines.push({ date: e.income_date, account: 'Professional Fees Income', debit: 0, credit: amount });
        });
        cashTransactions.filter(e => e.transaction_date.slice(0, 4) === String(journalYear)).forEach(e => {
          const amount = Number(e.amount) || 0;
          const cashAccount = e.payment_method?.toLowerCase() === 'cash' ? 'Cash on Hand' : 'Cash in Bank';
          const expenseAccount = activeJournalAccountNames.includes(e.category) ? e.category : 'Other Operating Expense';
          const isReceipt = e.transaction_type === 'receipt';
          lines.push({ date: e.transaction_date, account: isReceipt ? cashAccount : expenseAccount, debit: amount, credit: 0 });
          lines.push({ date: e.transaction_date, account: isReceipt ? 'Professional Fees Income' : cashAccount, debit: 0, credit: amount });
        });
        const normalDebitAccounts = ['Cash on Hand','Cash in Bank','Accounts Receivable','Computer and Equipment','Office Supplies Expense','Internet and Communications Expense','Utilities Expense','Transportation Expense','Software and Subscriptions Expense','Repairs and Maintenance Expense','Taxes and Licenses Expense','Bank Charges Expense','Depreciation Expense','Other Operating Expense',"Owner's Drawings"];
        const accountNames = Array.from(new Set([...activeJournalAccountNames, ...lines.map(line => line.account)])).sort();
        const rows = accountNames.map(account => {
          const debitTotal = lines.filter(line => line.account === account).reduce((sum, line) => sum + line.debit, 0);
          const creditTotal = lines.filter(line => line.account === account).reduce((sum, line) => sum + line.credit, 0);
          const net = debitTotal - creditTotal;
          // Net debit balance = total debits minus total credits.
          // Place a positive net in Debit and a negative net in Credit,
          // regardless of the account's normal balance.
          const debitBalance = Math.max(net, 0);
          const creditBalance = Math.max(-net, 0);
          return { account, debitBalance, creditBalance };
        }).filter(row => row.debitBalance > 0.000001 || row.creditBalance > 0.000001);
        const totalDebit = rows.reduce((sum, row) => sum + row.debitBalance, 0);
        const totalCredit = rows.reduce((sum, row) => sum + row.creditBalance, 0);
        const balanced = Math.abs(totalDebit - totalCredit) < 0.01;
        return <>
          <div className="mb-4 text-center">
            <h2 className="font-bold text-lg">TRIAL BALANCE</h2>
            <p className="text-sm">As of December 31, {journalYear}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm border-collapse">
              <thead><tr className="border-y-2 border-black"><th className="p-3 text-left">Account Title</th><th className="p-3 text-right">Debit (₱)</th><th className="p-3 text-right">Credit (₱)</th></tr></thead>
              <tbody>{rows.length === 0 ? <tr><td colSpan={3} className="p-8 text-center">No posted transactions for {journalYear}.</td></tr> : rows.map(row => <tr key={row.account} className="border-b border-neutral-300"><td className="p-3">{row.account}</td><td className="p-3 text-right">{row.debitBalance ? formatPeso(row.debitBalance) : '—'}</td><td className="p-3 text-right">{row.creditBalance ? formatPeso(row.creditBalance) : '—'}</td></tr>)}</tbody>
              <tfoot><tr className="border-y-2 border-black font-black"><td className="p-3">TOTAL</td><td className="p-3 text-right">{formatPeso(totalDebit)}</td><td className="p-3 text-right">{formatPeso(totalCredit)}</td></tr></tfoot>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="font-semibold">Difference: {formatPeso(Math.abs(totalDebit - totalCredit))}</p>
            <p className={`font-bold ${balanced ? 'text-green-700' : 'text-red-700'}`}>{balanced ? 'Debits and credits are balanced' : 'Out of balance — review source entries'}</p>
          </div>
        </>;
      })()}
      <p className="mt-4 text-xs text-neutral-600">This is a preliminary, system-generated trial balance based on saved General Journal entries and imported BIR/Cash Book records. Review source overlap, account classifications, opening balances, and adjustments before relying on it for formal reporting. A balanced trial balance does not by itself establish that all entries are complete or correct.</p>
    </div>
  </div>
)}


{activeTab === 'financial-statements' && (
  <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
    <style jsx global>{`
      @page { size: A4 portrait; margin: 15mm; }
      @media print {
        body * { visibility: hidden !important; }
        #financial-statements-print, #financial-statements-print * { visibility: visible !important; }
        #financial-statements-print { position: absolute; inset: 0; width: 100%; padding: 0; color: #000 !important; background: #fff !important; font-family: "Times New Roman", Times, serif !important; font-size: 10pt; }
        #financial-statements-print * { color: #000 !important; background: #fff !important; box-shadow: none !important; }
        #financial-statements-print .no-print { display: none !important; }
        #financial-statements-print table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        #financial-statements-print th, #financial-statements-print td { border-bottom: 1px solid #777; padding: 5px 7px; }
        #financial-statements-print .statement-total { border-top: 1px solid #000; border-bottom: 2px double #000; font-weight: bold; }
        /* Keep each formal financial statement on its own printed page. */
        #financial-statements-print section {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        #financial-statements-print section + section {
          break-before: page !important;
          page-break-before: always !important;
        }
        #financial-statements-print footer {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
      }
    `}</style>
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 no-print">
      <div>
        <h1 className="text-2xl font-black text-neutral-900">📑 Monthly and Annual Financial Statements</h1>
        <p className="text-sm text-neutral-500">Management reports generated from journal entries and linked cash-book records.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={statementBasis} onChange={e => setStatementBasis(e.target.value as 'monthly' | 'annual')} className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm">
          <option value="monthly">Monthly</option><option value="annual">Annual</option>
        </select>
        <select value={journalYear} onChange={e => setJournalYear(Number(e.target.value))} className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm">
          {Array.from({ length: Math.max(8, new Date().getFullYear() - 2025 + 1) }, (_, i) => new Date().getFullYear() - i).map(year => <option key={year} value={year}>{year}</option>)}
          {!Array.from({ length: Math.max(8, new Date().getFullYear() - 2025 + 1) }, (_, i) => new Date().getFullYear() - i).includes(2025) && <option value={2025}>2025</option>}
        </select>
        {statementBasis === 'monthly' && <select value={statementMonth} onChange={e => setStatementMonth(e.target.value)} className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm">{Array.from({length:12},(_,i)=>{const m=String(i+1).padStart(2,'0');return <option key={m} value={m}>{new Date(2000,i,1).toLocaleString('en-US',{month:'long'})}</option>})}</select>}
        <button type="button" onClick={() => window.print()} className={`rounded-xl px-4 py-2 text-sm font-bold ${t.accentBtn}`}>Print / Save PDF</button>
      </div>
    </div>
    <div id="financial-statements-print" className="bg-white text-black">
      {(() => {
        type StatementLine = { date:string; account:string; debit:number; credit:number; source:string };
        const allLines: StatementLine[] = [];
        journalEntries.forEach(e => { const a=Number(e.amount)||0; allLines.push({date:e.entry_date,account:e.debit_account,debit:a,credit:0,source:'General Journal'},{date:e.entry_date,account:e.credit_account,debit:0,credit:a,source:'General Journal'}); });
        birAdjustments.forEach(e => { const a=Number(e.amount)||0; allLines.push({date:e.income_date,account:'Cash in Bank',debit:a,credit:0,source:'BIR income record'},{date:e.income_date,account:'Professional Fees Income',debit:0,credit:a,source:'BIR income record'}); });
        cashTransactions.forEach(e => { const a=Number(e.amount)||0; const cash=e.payment_method?.toLowerCase()==='cash'?'Cash on Hand':'Cash in Bank'; const exp=activeJournalAccountNames.includes(e.category)?e.category:'Other Operating Expense'; const receipt=e.transaction_type==='receipt'; allLines.push({date:e.transaction_date,account:receipt?cash:exp,debit:a,credit:0,source:'Cash Book'},{date:e.transaction_date,account:receipt?'Professional Fees Income':cash,debit:0,credit:a,source:'Cash Book'}); });
        const inPeriod=(date:string)=>date?.slice(0,4)===String(journalYear) && (statementBasis==='annual' || date?.slice(5,7)===statementMonth);
        const lines=allLines.filter(x=>inPeriod(x.date));
        const debitNormal=['Cash on Hand','Cash in Bank','Accounts Receivable','Computer and Equipment','Office Supplies Expense','Internet and Communications Expense','Utilities Expense','Transportation Expense','Software and Subscriptions Expense','Repairs and Maintenance Expense','Taxes and Licenses Expense','Bank Charges Expense','Depreciation Expense','Other Operating Expense',"Owner's Drawings"];
        const accountNames=Array.from(new Set([...activeJournalAccountNames,...chartAccounts.map(a=>a.account_name),...lines.map(x=>x.account)]));
        const balances=accountNames.map(account=>{const dr=lines.filter(x=>x.account===account).reduce((v,x)=>v+x.debit,0);const cr=lines.filter(x=>x.account===account).reduce((v,x)=>v+x.credit,0);return {account,dr,cr,net:dr-cr};});
        const amount=(account:string)=>{const x=balances.find(b=>b.account===account);return x?x.net:0;};
        const legacyType = (name:string): VAChartAccount['account_type'] => {
          if (['Cash on Hand','Cash in Bank','Accounts Receivable','Computer and Equipment','Accumulated Depreciation'].includes(name)) return 'Asset';
          if (name === 'Accounts Payable') return 'Liability';
          if (["Owner's Capital","Owner's Drawings"].includes(name)) return 'Equity';
          if (name.toLowerCase().includes('income')) return 'Income';
          return 'Expense';
        };
        const accountTypeFor = (name:string) => chartAccounts.find(a => a.account_name === name)?.account_type || legacyType(name);
        const incomeAccounts=balances.filter(x=>accountTypeFor(x.account)==='Income').map(x=>({name:x.account,value:-x.net}));
        const expenseAccounts=balances.filter(x=>accountTypeFor(x.account)==='Expense').map(x=>({name:x.account,value:x.net}));
        const totalIncome=incomeAccounts.reduce((v,x)=>v+x.value,0); const totalExpenses=expenseAccounts.reduce((v,x)=>v+x.value,0); const netIncome=totalIncome-totalExpenses;
        const assets=balances.filter(x=>accountTypeFor(x.account)==='Asset').map(x=>({name:x.account,value:x.net})).filter(x=>Math.abs(x.value)>0.000001);
        const liabilities=balances.filter(x=>accountTypeFor(x.account)==='Liability').map(x=>({name:x.account,value:-x.net})).filter(x=>Math.abs(x.value)>0.000001);
        const equity=balances.filter(x=>accountTypeFor(x.account)==='Equity' && x.account !== "Owner's Drawings").map(x=>({name:x.account,value:-x.net})).filter(x=>Math.abs(x.value)>0.000001);
        const ownerDrawings = balances.filter(x=>accountTypeFor(x.account)==='Equity' && x.account === "Owner's Drawings").reduce((v,x)=>v+x.net,0);
        const totalAssets=assets.reduce((v,x)=>v+x.value,0); const totalLiabilities=liabilities.reduce((v,x)=>v+x.value,0); const totalEquity=equity.reduce((v,x)=>v+x.value,0)+netIncome-ownerDrawings;
        const cashLines=lines.filter(x=>['Cash on Hand','Cash in Bank'].includes(x.account)); const netCashMovement=cashLines.reduce((v,x)=>v+x.debit-x.credit,0);
        const periodLabel=statementBasis==='annual'?`For the year ended December 31, ${journalYear}`:`For the month ended ${new Date(Number(journalYear),Number(statementMonth),0).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`;
        const fmt=(v:number)=>`${v<0?'(':''}₱${formatPeso(Math.abs(v))}${v<0?')':''}`;
        const row=(name:string,value:number)=><tr key={name}><td>{name}</td><td className="text-right">{fmt(value)}</td></tr>;
        return <>
          <header className="text-center mb-7"><h2 className="font-bold text-lg tracking-wide">FINANCIAL STATEMENTS</h2><p className="font-semibold">Individual Professional / Self-Employed – Non-VAT</p><p className="text-sm">{periodLabel}</p><p className="text-xs mt-1">Currency: Philippine Peso (₱)</p></header>
          <section className="mb-8"><h3 className="text-center font-bold mb-1">STATEMENT OF COMPREHENSIVE INCOME</h3><p className="text-center text-xs mb-3">{periodLabel}</p><table><thead><tr><th className="text-left">Particulars</th><th className="text-right">Amount (₱)</th></tr></thead><tbody><tr><td colSpan={2} className="font-bold">Income</td></tr>{incomeAccounts.map(x=>row(x.name,x.value))}<tr className="statement-total"><td>Total Income</td><td className="text-right">{fmt(totalIncome)}</td></tr><tr><td colSpan={2} className="font-bold pt-3">Expenses</td></tr>{expenseAccounts.map(x=>row(x.name,x.value))}<tr className="statement-total"><td>Total Expenses</td><td className="text-right">{fmt(totalExpenses)}</td></tr><tr className="statement-total"><td>NET INCOME / (LOSS)</td><td className="text-right">{fmt(netIncome)}</td></tr></tbody></table></section>
          <section className="mb-8"><h3 className="text-center font-bold mb-1">STATEMENT OF FINANCIAL POSITION</h3><p className="text-center text-xs mb-3">As of {statementBasis==='annual'?`December 31, ${journalYear}`:new Date(Number(journalYear),Number(statementMonth),0).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</p><table><thead><tr><th className="text-left">Particulars</th><th className="text-right">Amount (₱)</th></tr></thead><tbody><tr><td colSpan={2} className="font-bold">Assets</td></tr>{assets.map(x=>row(x.name,x.value))}<tr className="statement-total"><td>Total Assets</td><td className="text-right">{fmt(totalAssets)}</td></tr><tr><td colSpan={2} className="font-bold pt-3">Liabilities</td></tr>{liabilities.map(x=>row(x.name,x.value))}<tr className="statement-total"><td>Total Liabilities</td><td className="text-right">{fmt(totalLiabilities)}</td></tr><tr><td colSpan={2} className="font-bold pt-3">Owner's Equity</td></tr>{equity.map(x=>row(x.name,x.value))}{row('Less: Owner Withdrawals',-ownerDrawings)}{row('Current Period Net Income / (Loss)',netIncome)}<tr className="statement-total"><td>Total Liabilities and Equity</td><td className="text-right">{fmt(totalLiabilities+totalEquity)}</td></tr></tbody></table><p className="text-xs mt-2">Position check (assets less liabilities and equity): {fmt(totalAssets-totalLiabilities-totalEquity)}. A non-zero difference indicates missing opening balances, incomplete classifications, or unrecorded transactions.</p></section>
          <section className="mb-8"><h3 className="text-center font-bold mb-1">STATEMENT OF CASH FLOWS (SUMMARY)</h3><p className="text-center text-xs mb-3">{periodLabel}</p><table><thead><tr><th className="text-left">Particulars</th><th className="text-right">Amount (₱)</th></tr></thead><tbody>{row('Net cash movement from recorded cash accounts',netCashMovement)}{row('Cash receipts recorded',cashLines.reduce((v,x)=>v+x.debit,0))}{row('Cash disbursements recorded',cashLines.reduce((v,x)=>v+x.credit,0))}</tbody></table></section>
          <section className="mb-8"><h3 className="text-center font-bold mb-1">STATEMENT OF CHANGES IN OWNER'S EQUITY (SUMMARY)</h3><p className="text-center text-xs mb-3">{periodLabel}</p><table><thead><tr><th className="text-left">Particulars</th><th className="text-right">Amount (₱)</th></tr></thead><tbody>{row('Recorded owner contributions',-amount("Owner's Capital"))}{row('Add: Net income / (loss)',netIncome)}{row('Less: Owner withdrawals',ownerDrawings)}<tr className="statement-total"><td>Net change in owner's equity (summary)</td><td className="text-right">{fmt(-amount("Owner's Capital")+netIncome-ownerDrawings)}</td></tr></tbody></table></section>
          <section className="mb-5"><h3 className="font-bold mb-2">NOTES TO THE FINANCIAL REPORTS</h3><ol className="list-decimal pl-5 text-xs space-y-1"><li>These are preliminary internal management reports generated from saved General Journal entries and linked BIR/Cash Book records for the selected period.</li><li>Historical source records may overlap. Confirm that each receipt or disbursement is represented only once before relying on totals.</li><li>Opening balances, depreciation, liabilities, owner contributions/withdrawals, and non-cash adjustments must be entered and reconciled where applicable.</li><li>These reports are not represented as PFRS-compliant financial statements or BIR-registered books. Confirm the applicable reporting framework and required disclosures with a Philippine CPA.</li></ol></section>
          <footer className="grid grid-cols-2 gap-12 text-xs mt-10"><div className="border-t border-black pt-2">Prepared by</div><div className="border-t border-black pt-2">Reviewed by</div></footer>
          <p className="text-xs mt-5 text-center">Generated from the VA & Freelance Management System · For internal review</p>
        </>;
      })()}
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
    ) +
  birAdjustments
    .filter(item =>
      reportMonth &&
      item.income_date?.slice(0, 7) === reportMonth
    )
    .reduce(
      (total, item) => total + (Number(item.amount) || 0),
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
    Billable time-tracker earnings plus manual income, January–December
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
                    <label className="block text-xs font-bold text-neutral-600 mb-1">RECEIPT LINK (OPTIONAL)</label>
                    <input
                      type="url"
                      value={birIncomeDocumentUrl}
                      onChange={e => setBirIncomeDocumentUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Paste the Google Drive, OneDrive, Dropbox, or other link to the receipt for this income entry.
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
                            ↗ View Receipt
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
                  
                  <button
  onClick={() => handleThemeChange('monochrome')}
  className={`p-3 rounded-xl border text-left font-medium text-sm transition ${
    theme === 'monochrome'
      ? 'border-black bg-neutral-100 text-black ring-2 ring-black/20'
      : 'border-neutral-200 bg-white text-neutral-700'
  }`}
>
  ◼ Monochrome – Black & White
</button>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">Invoice Sender Details</h2>
                  <p className="mt-1 text-xs text-neutral-500">These details appear on your printable invoices. Keep your TIN accurate before issuing invoices.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Full Name / Registered Name</label>
                  <input type="text" value={invoiceProfile.fullName} onChange={e => setInvoiceProfile(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Enter your registered name" className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Business / Registered Address</label>
                  <textarea rows={2} value={invoiceProfile.businessAddress} onChange={e => setInvoiceProfile(prev => ({ ...prev, businessAddress: e.target.value }))} placeholder="Enter your registered address" className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">TIN</label>
                    <input type="text" value={invoiceProfile.tin} onChange={e => setInvoiceProfile(prev => ({ ...prev, tin: e.target.value }))} placeholder="000-000-000-000" className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Contact Number</label>
                    <input type="tel" value={invoiceProfile.contactNumber} onChange={e => setInvoiceProfile(prev => ({ ...prev, contactNumber: e.target.value }))} placeholder="09XX XXX XXXX" className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800" />
                  </div>
                </div>
                {invoiceProfileMessage && <p className={`text-sm ${invoiceProfileMessage.startsWith('Could not') ? 'text-red-600' : 'text-green-700'}`}>{invoiceProfileMessage}</p>}
                <button type="button" onClick={saveInvoiceProfile} disabled={invoiceProfileSaving} className={`px-5 py-2.5 ${t.accentBtn} rounded-xl text-sm font-bold shadow-xs disabled:opacity-50`}>
                  {invoiceProfileSaving ? 'Saving...' : 'Save Invoice Details'}
                </button>
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