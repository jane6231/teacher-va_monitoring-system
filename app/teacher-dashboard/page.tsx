'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function TeacherDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('pink'); 
  const [dashboardCurrency, setDashboardCurrency] = useState('₱');
  
  // Calendar navigation state
  const [calendarDate, setCalendarDate] = useState<Date>(new Date(2026, 9, 7));
  
  // Student modal & list state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  // Edit student form state
  const [editName, setEditName] = useState('');
  const [editAlias, setEditAlias] = useState('');
  const [editVideo, setEditVideo] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editCurrency, setEditCurrency] = useState('');
  const [editPayment, setEditPayment] = useState('');
  const [editClasses, setEditClasses] = useState('0');
  const [editFree, setEditFree] = useState('0');
  const [editCompleted, setEditCompleted] = useState('0');
  const [editDuration, setEditDuration] = useState('40m');
  const [editPhp, setEditPhp] = useState('₱0');

  // Schedule modal state with checkbox days
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Wednesday']);
  const [scheduleTime, setScheduleTime] = useState('17:20');

  // Class action modal state (Present / Absent / Cancelled / Makeup)
  const [activeClassModal, setActiveClassModal] = useState<any>(null);
  const [makeupChecked, setMakeupChecked] = useState(false);
  const [makeupDate, setMakeupDate] = useState('');
  const [makeupTime, setMakeupTime] = useState('17:20');

  // Lesson Log Modal State
  const [showLessonLogModal, setShowLessonLogModal] = useState(false);
  const [lessonLogData, setLessonLogData] = useState({
    book: '',
    startPage: '',
    endPage: '',
    title: '',
    date: '',
    vocabulary: '',
    strengths: '',
    nextFocus: '',
    teacherMessage: '',
    homework: ''
  });

  // Books State
  const [booksList, setBooksList] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teacher_dashboard_books');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed) return parsed;
        } catch (e) { console.error(e); }
      }
    }
    return [];
  });
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookType, setNewBookType] = useState('page-based');
  const [bookChapters, setBookChapters] = useState([{ title: '', url: '' }]);

  // Payments State
  const [paymentsList, setPaymentsList] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teacher_dashboard_payments');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed) return parsed;
        } catch (e) { console.error(e); }
      }
    }
    return [];
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState('');
  const [paymentAmountOriginal, setPaymentAmountOriginal] = useState('');
  const [paymentNetPhp, setPaymentNetPhp] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentStatus, setPaymentStatus] = useState('Paid');

  // Students List
  const [studentsList, setStudentsList] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teacher_dashboard_students');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed) return parsed;
        } catch (e) { console.error(e); }
      }
    }
    return [];
  });
  
  // New student form state
  const [studentName, setStudentName] = useState('');
  const [teacherAlias, setTeacherAlias] = useState('TEACHER GABI');
  const [videoLink, setVideoLink] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('Vietnam 🇻🇳');
  const [currency, setCurrency] = useState('₫ (VND) - Vietnamese Dong');
  const [paymentAmount, setPaymentAmount] = useState('0');
  const [classesIncluded, setClassesIncluded] = useState('0');
  const [freeClasses, setFreeClasses] = useState('0');
  const [rolloverClasses, setRolloverClasses] = useState('0');
  const [classDuration, setClassDuration] = useState('40m');
  const [startDate, setStartDate] = useState('2026-10-07');
  const [phpApprox, setPhpApprox] = useState('₱0');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const savedTheme = localStorage.getItem('teacher_dashboard_theme');
    if (savedTheme) setTheme(savedTheme);

    const savedCurrency = localStorage.getItem('teacher_dashboard_currency');
    if (savedCurrency) setDashboardCurrency(savedCurrency);

    const today = new Date();
    setCalendarDate(today);
    setStartDate(today.toISOString().split('T')[0]);
  }, []);

  const generateStudentSessions = (student: any) => {
    if (!student.startDate || !student.classesIncluded || !student.schedules || student.schedules.length === 0) return [];
    const parts = student.startDate.split('-').map(Number);
    if (parts.length !== 3) return [];
    let curr = new Date(parts[0], parts[1] - 1, parts[2]);

    const dayNameMap: {[key: string]: number} = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    const scheduleMap = new Map();
    student.schedules.forEach((sch: any) => {
      scheduleMap.set(dayNameMap[sch.day], sch);
    });

    const validDays = Array.from(scheduleMap.keys()).filter(d => d !== undefined);
    if (validDays.length === 0) return [];

    let sessions: any[] = [];
    let count = 0;
    let safety = 1500;

    while (count < student.classesIncluded && safety > 0) {
      const dayOfWeek = curr.getDay();
      if (validDays.includes(dayOfWeek)) {
        const sch = scheduleMap.get(dayOfWeek);
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        sessions.push({
          id: `${student.id}-${dateStr}-${sch.time}`,
          studentId: student.id,
          studentName: student.studentName,
          date: dateStr,
          time: sch.time,
          duration: sch.duration,
          videoLink: student.videoLink,
          status: student.sessionStatuses?.[dateStr] || 'upcoming',
          makeup: student.sessionMakeups?.[dateStr] || null
        });
        count++;
      }
      curr.setDate(curr.getDate() + 1);
      safety--;
    }
    return sessions;
  };

  const calculateEndDate = (student: any) => {
    const sessions = generateStudentSessions(student);
    if (sessions.length === 0) return '';
    return sessions[sessions.length - 1].date;
  };

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);
      setLoading(false);
    }
    getUser();
  }, [router, supabase]);

  useEffect(() => {
    const updatedWithEndDates = studentsList.map(student => ({
      ...student,
      endDate: calculateEndDate(student)
    }));
    localStorage.setItem('teacher_dashboard_students', JSON.stringify(updatedWithEndDates));
    if (selectedStudent) {
      const updatedCurrent = updatedWithEndDates.find(s => s.id === selectedStudent.id);
      if (updatedCurrent) setSelectedStudent(updatedCurrent);
    }
  }, [studentsList]);

  useEffect(() => {
    localStorage.setItem('teacher_dashboard_books', JSON.stringify(booksList));
  }, [booksList]);

  useEffect(() => {
    localStorage.setItem('teacher_dashboard_payments', JSON.stringify(paymentsList));
  }, [paymentsList]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('teacher_dashboard_theme', newTheme);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setDashboardCurrency(newCurrency);
    localStorage.setItem('teacher_dashboard_currency', newCurrency);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/sign-up');
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName) return;

    const numClasses = parseInt(classesIncluded) || 0;
    const numFree = parseInt(freeClasses) || 0;

    const newStudent = {
      id: Date.now(),
      studentName,
      teacherAlias: teacherAlias || 'TEACHER GABI',
      videoLink: videoLink || '',
      email: email || '',
      phone: phone || '',
      age: age || '',
      country,
      currency,
      paymentAmount: paymentAmount || '0',
      classesIncluded: numClasses,
      freeClasses: numFree,
      rolloverClasses: parseInt(rolloverClasses) || 0,
      classesCompleted: 0,
      classDuration,
      startDate,
      endDate: '',
      phpApprox: phpApprox || '₱0',
      status: 'PAID',
      schedules: [],
      sessionStatuses: {},
      sessionMakeups: {},
      assignedBook: 'No book assigned yet',
      bookProgress: '0% Done',
      bookPage: 'Page 0 / 0',
      reports: []
    };

    setStudentsList([newStudent, ...studentsList]);
    setShowAddModal(false);
    setStudentName('');
    setVideoLink('');
    setEmail('');
    setPhone('');
    setAge('');
    setPaymentAmount('0');
    setClassesIncluded('0');
  };

  const handleOpenEditModal = () => {
    if (!selectedStudent) return;
    setEditName(selectedStudent.studentName || '');
    setEditAlias(selectedStudent.teacherAlias || 'TEACHER GABI');
    setEditVideo(selectedStudent.videoLink || '');
    setEditEmail(selectedStudent.email || '');
    setEditPhone(selectedStudent.phone || '');
    setEditAge(selectedStudent.age || '');
    setEditCountry(selectedStudent.country || 'Vietnam 🇻🇳');
    setEditCurrency(selectedStudent.currency || '₫ (VND) - Vietnamese Dong');
    setEditPayment(selectedStudent.paymentAmount || '0');
    setEditClasses(String(selectedStudent.classesIncluded || '0'));
    setEditFree(String(selectedStudent.freeClasses || '0'));
    setEditCompleted(String(selectedStudent.classesCompleted || '0'));
    setEditDuration(selectedStudent.classDuration || '40m');
    setEditPhp(selectedStudent.phpApprox || '₱0');
    setShowEditModal(true);
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !editName) return;

    const updatedStudents = studentsList.map(s => {
      if (s.id === selectedStudent.id) {
        return {
          ...s,
          studentName: editName,
          teacherAlias: editAlias,
          videoLink: editVideo,
          email: editEmail,
          phone: editPhone,
          age: editAge,
          country: editCountry,
          currency: editCurrency,
          paymentAmount: editPayment,
          classesIncluded: parseInt(editClasses) || 0,
          freeClasses: parseInt(editFree) || 0,
          classesCompleted: parseInt(editCompleted) || 0,
          classDuration: editDuration,
          phpApprox: editPhp
        };
      }
      return s;
    });

    setStudentsList(updatedStudents);
    const updatedCurrent = updatedStudents.find(s => s.id === selectedStudent.id);
    if (updatedCurrent) setSelectedStudent(updatedCurrent);
    setShowEditModal(false);
  };

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle) return;

    const newBook = {
      id: Date.now(),
      title: newBookTitle,
      type: newBookType,
      pages: '100 PAGES',
      chapters: bookChapters.filter(c => c.title.trim() !== '')
    };

    setBooksList([newBook, ...booksList]);
    setNewBookTitle('');
    setBookChapters([{ title: '', url: '' }]);
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentStudent || !paymentNetPhp) return;

    const newPayment = {
      id: Date.now(),
      student: paymentStudent,
      country: 'International',
      date: new Date().toISOString().split('T')[0],
      originalAmount: paymentAmountOriginal || '₱0',
      grossPhp: paymentNetPhp,
      transferFee: '₱0',
      netPhp: paymentNetPhp,
      method: paymentMethod,
      status: paymentStatus
    };

    setPaymentsList([newPayment, ...paymentsList]);
    setShowPaymentModal(false);
    setPaymentStudent('');
    setPaymentAmountOriginal('');
    setPaymentNetPhp('');
  };

  const handleDayToggle = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || selectedDays.length === 0) return;

    const newSchedules = selectedDays.map(day => ({
      id: Date.now() + Math.random(),
      day,
      time: scheduleTime,
      duration: selectedStudent.classDuration
    }));

    const updatedStudents = studentsList.map(s => {
      if (s.id === selectedStudent.id) {
        return { ...s, schedules: [...(s.schedules || []), ...newSchedules] };
      }
      return s;
    });

    setStudentsList(updatedStudents);
    setShowScheduleModal(false);
    setSelectedDays(['Wednesday']);
  };

  const handleDeleteSchedule = (scheduleId: number) => {
    if (!selectedStudent) return;
    const updatedStudents = studentsList.map(s => {
      if (s.id === selectedStudent.id) {
        return { ...s, schedules: (s.schedules || []).filter((sch: any) => sch.id !== scheduleId) };
      }
      return s;
    });
    setStudentsList(updatedStudents);
  };

  const handleSaveClassStatus = (status: 'present' | 'absent' | 'cancelled') => {
    if (!activeClassModal) return;
    const { student, sessionDate } = activeClassModal;

    if (status === 'present') {
      // Do NOT clear activeClassModal here so handleSaveLessonLog can use it!
      setLessonLogData({
        book: '',
        startPage: '',
        endPage: '',
        title: '',
        date: sessionDate,
        vocabulary: '',
        strengths: '',
        nextFocus: '',
        teacherMessage: '',
        homework: ''
      });
      setShowLessonLogModal(true);
      return;
    }

    const updatedStudents = studentsList.map(s => {
      if (s.id === student.id) {
        const newStatuses = { ...(s.sessionStatuses || {}), [sessionDate]: status };
        let newRollover = s.rolloverClasses || 0;
        const newMakeups = { ...(s.sessionMakeups || {}) };

        if (makeupChecked && makeupDate) {
          newMakeups[sessionDate] = { date: makeupDate, time: makeupTime };
          newRollover += 1;
        }

        return {
          ...s,
          rolloverClasses: newRollover,
          sessionStatuses: newStatuses,
          sessionMakeups: newMakeups
        };
      }
      return s;
    });

    setStudentsList(updatedStudents);
    setActiveClassModal(null);
    setMakeupChecked(false);
    setMakeupDate('');
  };

  const handleSaveLessonLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClassModal) return;
    const { student, sessionDate } = activeClassModal;

    const updatedStudents = studentsList.map(s => {
      if (s.id === student.id) {
        const newStatuses = { ...(s.sessionStatuses || {}), [sessionDate]: 'present' };
        const newCompleted = (s.classesCompleted || 0) + 1;
        const newReports = [{ id: Date.now(), ...lessonLogData }, ...(s.reports || [])];

        return {
          ...s,
          classesCompleted: newCompleted,
          sessionStatuses: newStatuses,
          reports: newReports
        };
      }
      return s;
    });

    setStudentsList(updatedStudents);
    setShowLessonLogModal(false);
    setActiveClassModal(null);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-neutral-100 text-neutral-800 font-medium">Loading teacher portal...</div>;
  }

  // Calendar Navigation Handlers
  const handlePrevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));

  const currentYear = calendarDate.getFullYear();
  const currentMonthIndex = calendarDate.getMonth();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = monthNames[currentMonthIndex];

  const firstDayIndex = (new Date(currentYear, currentMonthIndex, 1).getDay() + 6) % 7;
  const totalDaysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const calendarDays = [...Array(firstDayIndex).fill(null), ...Array.from({ length: totalDaysInMonth }, (_, i) => i + 1)];

  const getClassesForDate = (dayNum: number) => {
    const m = String(currentMonthIndex + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    const targetDateStr = `${currentYear}-${m}-${d}`;

    const classes: any[] = [];
    studentsList.forEach(student => {
      const studentSessions = generateStudentSessions(student);
      studentSessions.forEach(sesh => {
        if (sesh.date === targetDateStr) classes.push({ ...sesh, student });
      });
      if (student.sessionMakeups) {
        Object.entries(student.sessionMakeups as Record<string, any>).forEach(([origDate, makeup]) => {
          if (makeup && makeup.date === targetDateStr) {
            classes.push({
              id: `${student.id}-makeup-${targetDateStr}`,
              studentId: student.id,
              studentName: `${student.studentName} (Make-up)`,
              date: targetDateStr,
              time: makeup.time,
              duration: student.classDuration,
              videoLink: student.videoLink,
              status: 'makeup',
              student
            });
          }
        });
      }
    });
    classes.sort((a, b) => a.time.localeCompare(b.time));
    return classes;
  };

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = String(today.getMonth() + 1).padStart(2, '0');
  const todayD = String(today.getDate()).padStart(2, '0');
  const todayStr = `${todayY}-${todayM}-${todayD}`;
  const todayDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];

  const todaysClasses: any[] = [];
  studentsList.forEach(student => {
    const studentSessions = generateStudentSessions(student);
    studentSessions.forEach(sesh => {
      if (sesh.date === todayStr) todaysClasses.push({ ...sesh, student });
    });
  });
  todaysClasses.sort((a, b) => a.time.localeCompare(b.time));

  const countriesWithFlags = [
    "Vietnam 🇻🇳", "China 🇨🇳", "Philippines 🇵🇭", "South Korea 🇰🇷", "Japan 🇯🇵", "Taiwan 🇹🇼", "Thailand 🇹🇭", "Indonesia 🇮🇩", "Malaysia 🇲🇾", "Singapore 🇸🇬",
    "Afghanistan 🇦🇫", "Albania 🇦🇱", "Algeria 🇩🇿", "Andorra 🇦🇩", "Angola 🇦🇴", "Argentina 🇦🇷", "Armenia 🇦🇲", "Australia 🇦🇺", "Austria 🇦🇹", "Azerbaijan 🇦🇿",
    "Bahamas 🇧🇸", "Bahrain 🇧🇭", "Bangladesh 🇧🇩", "Barbados 🇧🇧", "Belarus 🇧🇾", "Belgium 🇧🇪", "Belize 🇧🇿", "Benin 🇧🇯", "Bhutan 🇧🇹", "Bolivia 🇧🇴", "Bosnia and Herzegovina 🇧🇦", "Botswana 🇧🇼", "Brazil 🇧🇷", "Brunei 🇧🇳", "Bulgaria 🇧🇬", "Burkina Faso 🇧🇫", "Burundi 🇧🇮",
    "Cambodia 🇰🇭", "Cameroon 🇨🇲", "Canada 🇨🇦", "Cape Verde 🇨🇻", "Central African Republic 🇨🇫", "Chad 🇹🇩", "Chile 🇨🇱", "Colombia 🇨🇴", "Comoros 🇰🇲", "Congo 🇨🇬", "Costa Rica 🇨🇷", "Croatia 🇭🇷", "Cuba 🇨🇺", "Cyprus 🇨🇾", "Czech Republic 🇨🇿",
    "Denmark 🇩🇰", "Djibouti 🇩🇯", "Dominica 🇩🇲", "Dominican Republic 🇩🇴",
    "Ecuador 🇪🇨", "Egypt 🇪🇬", "El Salvador 🇸🇻", "Estonia 🇪🇪", "Ethiopia 🇪🇹",
    "Fiji 🇫🇯", "Finland 🇫🇮", "France 🇫🇷",
    "Germany 🇩🇪", "Ghana 🇬🇭", "Greece 🇬🇷", "Guatemala 🇬🇹", "Hong Kong 🇭🇰", "Hungary 🇭🇺",
    "India 🇮🇳", "Ireland 🇮🇪", "Israel 🇮🇱", "Italy 🇮🇹",
    "Mexico 🇲🇽", "Netherlands 🇳🇱", "New Zealand 🇳🇿", "Poland 🇵🇱", "Portugal 🇵🇹",
    "Russia 🇷🇺", "South Africa 🇿🇦", "Spain 🇪🇸", "Sweden 🇸🇪", "Switzerland 🇨🇭",
    "Turkey 🇹🇷", "United Kingdom 🇬🇧", "United States 🇺🇸", "Zimbabwe 🇿🇼"
  ];

  const currenciesWithSymbols = [
    "₫ (VND) - Vietnamese Dong", "¥ (CNY) - Chinese Yuan", "₱ (PHP) - Philippine Peso", "$ (USD) - US Dollar", "€ (EUR) - Euro", "£ (GBP) - British Pound",
    "¥ (JPY) - Japanese Yen", "₩ (KRW) - South Korean Won", "฿ (THB) - Thai Baht", "$ (AUD) - Australian Dollar", "$ (CAD) - Canadian Dollar", "$ (SGD) - Singapore Dollar"
  ];

  const themes: any = {
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

  const t = themes[theme] || themes.pink;

  return (
    <div className={`flex min-h-screen ${t.bgMain} text-neutral-900 transition-colors duration-300 relative`}>
      {/* Sidebar */}
      <aside className={`w-64 ${t.sidebar} flex flex-col justify-between p-6 shadow-md fixed h-full z-10 border-r`}>
        <div>
          <div className={`flex items-center gap-3 mb-8 ${t.brandBox} p-3 rounded-xl border`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner ${t.brandIcon}`}>
              {theme === 'teal' ? '🌿' : theme === 'charcoal' ? '💼' : theme === 'indigo' ? '🎓' : theme === 'pink' ? '🌸' : '🌈'}
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white">Teacher Portal</h2>
              <p className="text-xs opacity-75">Class Dashboard</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button onClick={() => { setActiveTab('dashboard'); setSelectedStudent(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'dashboard' ? t.navActive : t.navInactive}`}>📊 My Dashboard</button>
            <button onClick={() => { setActiveTab('students'); setSelectedStudent(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'students' ? t.navActive : t.navInactive}`}>👩‍🎓 My Students</button>
            <button onClick={() => { setActiveTab('books'); setSelectedStudent(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'books' ? t.navActive : t.navInactive}`}>📚 Books</button>
            <button onClick={() => { setActiveTab('payments'); setSelectedStudent(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'payments' ? t.navActive : t.navInactive}`}>💳 Payments</button>
            <button onClick={() => { setActiveTab('reports'); setSelectedStudent(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'reports' ? t.navActive : t.navInactive}`}>📈 Reports</button>
            <button onClick={() => { setActiveTab('settings'); setSelectedStudent(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === 'settings' ? t.navActive : t.navInactive}`}>⚙️ Account Settings</button>
          </nav>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-2 opacity-75 hover:opacity-100 px-4 py-2 text-sm font-medium transition mt-auto border-t border-current/20 pt-4">🚪 Sign Out</button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && !selectedStudent && (
          <>
            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8`}>
              <div>
                <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2">Teacher Dashboard ✨</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Manage your monthly schedules and class attendance</p>
              </div>
              <div className="flex items-center gap-2 bg-neutral-100/80 p-1.5 rounded-xl border border-neutral-200 text-sm font-medium">
                <button className="px-3 py-1.5 rounded-lg text-neutral-600 hover:bg-white transition">Today</button>
                <button className="px-3 py-1.5 rounded-lg text-neutral-600 hover:bg-white transition">This Week</button>
                <button className={`px-3 py-1.5 rounded-lg text-white shadow-xs ${t.accentBtn}`}>This Month</button>
                <button className="px-3 py-1.5 rounded-lg text-neutral-600 hover:bg-white transition">This Year</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>TODAY'S SCHEDULE</span><p className="text-3xl font-black text-neutral-900 mt-3">{todaysClasses.length}</p><p className="text-xs text-neutral-500 font-medium mt-1">Classes</p></div>
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>TOTAL CLASSES</span><p className="text-3xl font-black text-neutral-900 mt-3">{studentsList.reduce((acc, s) => acc + (s.classesIncluded || 0), 0)}</p><p className="text-xs text-neutral-500 font-medium mt-1">Lessons</p></div>
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>LIFETIME TOTAL</span><p className="text-3xl font-black text-neutral-900 mt-3">{studentsList.reduce((acc, s) => acc + (s.classesCompleted || 0), 0)}</p><p className="text-xs text-neutral-500 font-medium mt-1">Done</p></div>
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>TEACHING TIME</span><p className="text-3xl font-black text-neutral-900 mt-3">0.0</p><p className="text-xs text-neutral-500 font-medium mt-1">Hours</p></div>
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}><span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>REVENUE & TUITION</span><p className={`text-2xl font-black ${t.currencyColor} mt-3`}>{dashboardCurrency}0</p><p className="text-xs text-neutral-500 font-medium mt-1">{studentsList.length} students</p></div>
            </div>

            {/* Today's Classes */}
            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} mb-8`}>
              <h2 className="text-base font-bold text-neutral-900 mb-4">📅 Classes for Today ({todayDayName})</h2>
              {todaysClasses.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl">
                  <p className="text-sm font-medium text-neutral-500">No classes scheduled for today yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysClasses.map((cls, idx) => (
                    <div key={idx} className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-pink-100 text-[#FF2E7E] font-bold text-xs rounded-lg">{cls.time}</span>
                          <h3 className="font-bold text-sm text-neutral-900">{cls.studentName}</h3>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">Duration: {cls.duration}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setActiveClassModal({ student: cls.student, sessionDate: cls.date, sessionTime: cls.time, studentName: cls.studentName })} className="px-3 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl text-xs font-bold transition">Mark Status</button>
                        {cls.videoLink && <a href={cls.videoLink} target="_blank" rel="noreferrer" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition">Join Classroom ↗</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calendar */}
            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-neutral-900">{currentMonthName} {currentYear}</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCalendarDate(new Date())} className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition">Today</button>
                  <button onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-sm font-bold transition">‹</button>
                  <button onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-sm font-bold transition">›</button>
                </div>
              </div>

              <div className={`grid grid-cols-7 text-center font-bold text-xs ${t.textMuted} py-3 border-b border-neutral-100`}><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div>
              <div className="grid grid-cols-7 gap-2 pt-4">
                {calendarDays.map((day, index) => {
                  const dayClasses = day ? getClassesForDate(day) : [];
                  return (
                    <div key={index} className={`h-32 p-2 border rounded-xl flex flex-col justify-between overflow-y-auto ${day ? `${t.cardBorder} ${t.cardBg} shadow-xs` : 'border-neutral-100 bg-neutral-50/40'}`}>
                      {day && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-neutral-700">{day}</span>
                            {dayClasses.length > 0 && <span className="px-1.5 py-0.5 bg-pink-100 text-[#FF2E7E] text-[10px] font-bold rounded-md">{dayClasses.length}</span>}
                          </div>
                          <div className="space-y-1 mt-1">
                            {dayClasses.map((cls, idx) => {
                              const status = cls.status;
                              let statusBadge = status === 'present' ? 'bg-emerald-100 text-emerald-800' : status === 'absent' ? 'bg-red-100 text-red-800' : status === 'cancelled' ? 'bg-amber-100 text-amber-800' : 'bg-neutral-50 border border-neutral-200 text-neutral-900';
                              return (
                                <div key={idx} onClick={() => setActiveClassModal({ student: cls.student, sessionDate: cls.date, sessionTime: cls.time, studentName: cls.studentName })} className={`p-1.5 rounded-md text-[10px] cursor-pointer hover:opacity-80 transition truncate ${statusBadge}`} title={`Click to mark status: ${cls.time} - ${cls.studentName}`}>
                                  <span className="font-bold">{cls.time}</span> {cls.studentName}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && !selectedStudent && (
          <div className="space-y-6">
            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} flex justify-between items-center`}>
              <div>
                <h1 className="text-2xl font-black text-neutral-900">Students</h1>
                <p className="text-xs text-neutral-500 mt-0.5">Manage your student enrollments, rates, assigned teacher aliases, and classroom links.</p>
              </div>
              <button onClick={() => setShowAddModal(true)} className={`px-4 py-2.5 ${t.accentBtn} rounded-xl text-xs font-bold shadow-xs transition`}>+ Add Student</button>
            </div>

            {studentsList.length === 0 ? (
              <div className="p-16 text-center bg-white border border-dashed border-neutral-200 rounded-2xl">
                <p className="text-sm font-medium text-neutral-500">No students added yet. Click "+ Add Student" to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studentsList.map((s) => (
                  <div key={s.id} onClick={() => setSelectedStudent(s)} className="p-5 border border-pink-100 rounded-2xl bg-white shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-black text-base text-neutral-900">{s.studentName}</h3>
                        <span className="px-2 py-0.5 bg-pink-50 text-[#FF2E7E] text-[10px] font-bold rounded-md uppercase tracking-wider">{s.teacherAlias || 'TEACHER GABI'}</span>
                      </div>
                      <p className="text-xs text-neutral-500 mb-4">{s.country}</p>
                      <div className="space-y-2 border-t border-neutral-100 pt-3 text-xs">
                        <div className="flex justify-between text-neutral-600">
                          <span>Package:</span>
                          <span className="font-bold text-neutral-900">{s.classesIncluded} {s.freeClasses ? `(+${s.freeClasses} free)` : ''} Classes ({s.classDuration})</span>
                        </div>
                        <div className="flex justify-between text-neutral-600">
                          <span>Rate:</span>
                          <span className="font-bold text-neutral-900">{s.paymentAmount}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-4 border-t border-neutral-100 text-xs">
                      <span className="text-neutral-500 font-medium">PHP Approx:</span>
                      <span className="font-black text-[#FF2E7E]">{s.phpApprox || '₱0'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STUDENT INDIVIDUAL DETAIL VIEW */}
        {activeTab === 'students' && selectedStudent && (
          <div className="space-y-6">
            <div className={`${t.cardBg} p-4 rounded-2xl shadow-xs border ${t.cardBorder} flex flex-wrap justify-between items-center gap-3`}>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedStudent(null)} className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition">← Back to Students</button>
                <button onClick={() => alert('Portal link copied!')} className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition">📋 Copy Portal Link</button>
                <button onClick={() => alert('Renewal Notice generated!')} className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-[#FF2E7E] rounded-xl text-xs font-bold transition">📄 Renewal Notice & Invoice</button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => alert('Renewal processed!')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition">✨ Process Paid Renewal</button>
                <button onClick={handleOpenEditModal} className="px-3 py-1.5 bg-[#FF2E7E] hover:bg-[#e0226e] text-white rounded-xl text-xs font-bold shadow-xs transition">✏️ Edit Student</button>
                <button onClick={() => { setStudentsList(studentsList.filter(item => item.id !== selectedStudent.id)); setSelectedStudent(null); }} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition">🗑️ Delete</button>
              </div>
            </div>

            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} flex flex-col md:flex-row justify-between items-start md:items-center gap-6`}>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black text-neutral-900">{selectedStudent.studentName}</h1>
                  <span className="px-2.5 py-1 bg-pink-50 text-[#FF2E7E] text-xs font-bold rounded-lg uppercase">{selectedStudent.teacherAlias || 'TEACHER GABI'}</span>
                </div>
                <p className="text-xs text-neutral-500 font-medium">
                  {selectedStudent.country} • Age: {selectedStudent.age || 'N/A'} • Email: {selectedStudent.email || 'N/A'} • Phone: {selectedStudent.phone || 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl w-full md:w-auto">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">📹 Classroom Meeting Link</span>
                <a href={selectedStudent.videoLink || '#'} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline truncate block max-w-xs">
                  {selectedStudent.videoLink || 'No meeting link provided'}
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} flex flex-col justify-between`}>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-sm text-neutral-900">Class Package</h3>
                    <span className="text-xs font-black text-[#FF2E7E]">0% Done</span>
                  </div>
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden mb-4">
                    <div className="bg-[#FF2E7E] h-full w-[0%]" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100 text-center">
                  <div><p className="text-[10px] font-bold text-neutral-400 uppercase">Completed</p><p className="text-xl font-black text-neutral-900">{selectedStudent.classesCompleted || 0}</p></div>
                  <div><p className="text-[10px] font-bold text-neutral-400 uppercase">Remaining</p><p className="text-xl font-black text-neutral-900">{selectedStudent.classesIncluded || 0}</p></div>
                  <div><p className="text-[10px] font-bold text-neutral-400 uppercase">Duration</p><p className="text-xl font-black text-neutral-900">{selectedStudent.classDuration || '40m'}</p></div>
                </div>
              </div>

              <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} flex flex-col justify-between`}>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-sm text-neutral-900">Assigned Books & Progress</h3>
                    <button className="text-xs font-bold text-[#FF2E7E] hover:underline">Edit Books</button>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-xs text-neutral-900">{selectedStudent.assignedBook || 'No book assigned'}</span>
                      <span className="text-[10px] font-bold text-[#FF2E7E]">0% Done</span>
                    </div>
                    <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden mb-2">
                      <div className="bg-[#FF2E7E] h-full w-[0%]" />
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-500 font-medium">
                      <span>Page 0 / 0</span>
                      <span>Page-Based</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} flex flex-col justify-between`}>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 mb-4">Tuition & Billing</h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between text-neutral-600"><span>Package Rate:</span><span className="font-bold text-neutral-900">{selectedStudent.paymentAmount || '0'}</span></div>
                    <div className="flex justify-between text-neutral-600"><span>PHP Value:</span><span className="font-bold text-neutral-900">{selectedStudent.phpApprox || '₱0'}</span></div>
                    <div className="flex justify-between text-neutral-600"><span>Payment Status:</span><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px]">PAID</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm text-neutral-900">Weekly Schedule</h3>
                    <button onClick={() => setShowScheduleModal(true)} className="text-xs font-bold text-[#FF2E7E] hover:underline">+ Add Schedule</button>
                  </div>
                  {(!selectedStudent.schedules || selectedStudent.schedules.length === 0) ? (
                    <p className="text-xs text-neutral-500">No schedules set yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedStudent.schedules.map((sch: any) => (
                        <div key={sch.id} className="p-3 bg-neutral-50 rounded-xl flex justify-between items-center text-xs border border-neutral-200">
                          <span><strong>{sch.day}</strong> at <span className="text-[#FF2E7E] font-bold">{sch.time}</span> ({sch.duration})</span>
                          <button onClick={() => handleDeleteSchedule(sch.id)} className="text-red-500 font-bold">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm text-neutral-900">Welcome Card & Contract</h3>
                    <button className="px-3 py-1 bg-pink-50 text-[#FF2E7E] text-xs font-bold rounded-lg">TEMPLATES</button>
                  </div>

                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3 mb-4">
                    <h4 className="text-xs font-bold text-neutral-700 uppercase">Customization Fields</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div><label className="block text-[10px] font-bold text-neutral-500 mb-1">Student Name</label><input type="text" readOnly value={selectedStudent.studentName} className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs" /></div>
                      <div><label className="block text-[10px] font-bold text-neutral-500 mb-1">Teacher Name</label><input type="text" readOnly value={selectedStudent.teacherAlias} className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs" /></div>
                      <div><label className="block text-[10px] font-bold text-neutral-500 mb-1">Effective Date</label><input type="text" readOnly value={selectedStudent.startDate} className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs" /></div>
                      <div><label className="block text-[10px] font-bold text-neutral-500 mb-1">Classes Count</label><input type="text" readOnly value={selectedStudent.classesIncluded} className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs" /></div>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-neutral-200 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-xs text-neutral-800">✨ Welcome Card</span>
                      <button className="text-[10px] font-bold text-[#FF2E7E]">Copy Note</button>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Welcome to Private English Classes! 🌸<br/><br/>
                      Dear {selectedStudent.studentName},<br/><br/>
                      A huge warm welcome to our English learning journey together! I am so excited to have you in class. Our lessons are designed to be fun, interactive, and completely tailored to help you reach your language goals.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm text-neutral-900">Logged Lessons & Reports ({selectedStudent.reports?.length || 0})</h3>
                  </div>
                  {(!selectedStudent.reports || selectedStudent.reports.length === 0) ? (
                    <div className="p-8 text-center bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl">
                      <p className="text-xs font-medium text-neutral-500">No lesson reports logged yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedStudent.reports.map((rep: any) => (
                        <div key={rep.id} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
                          <div className="flex justify-between items-center"><span className="font-black text-neutral-900">{rep.title}</span><span className="text-neutral-400">{rep.date}</span></div>
                          <p className="text-neutral-600"><strong>Vocabulary:</strong> {rep.vocabulary}</p>
                          <p className="text-neutral-600"><strong>Strengths:</strong> {rep.strengths}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
                  <h3 className="font-bold text-sm text-neutral-900 mb-2">Teacher Notes & Objectives</h3>
                  <p className="text-xs text-neutral-500">No teacher notes recorded yet.</p>
                </div>

                <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
                  <h3 className="font-bold text-sm text-neutral-900 mb-2">Parent Notes & Requests</h3>
                  <p className="text-xs text-neutral-500">No notes received from parents yet.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOOKS TAB */}
        {activeTab === 'books' && !selectedStudent && (
          <div className="space-y-6">
            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
              <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2">Curriculum Books 📚</h1>
              <p className="text-sm text-neutral-500 mt-0.5">Organize your books into chapter curricula or standalone page files.</p>
            </div>

            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
              <h2 className="text-base font-black text-neutral-900 mb-4">Add New Book / File</h2>
              <form onSubmit={handleAddBook} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Book Title *</label>
                    <input type="text" required placeholder="e.g. Alpha Kids Level 1" value={newBookTitle} onChange={(e) => setNewBookTitle(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Tracking Type *</label>
                    <select value={newBookType} onChange={(e) => setNewBookType(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-white">
                      <option value="chapter-based">Chapter-Based Curriculum</option>
                      <option value="page-based">Page-Based Standalone File</option>
                    </select>
                  </div>
                </div>

                {newBookType === 'chapter-based' && (
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-neutral-700">Chapters / PPT Links</label>
                    {bookChapters.map((ch, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input type="text" placeholder={`Chapter ${idx + 1} Title`} value={ch.title} onChange={(e) => { const updated = [...bookChapters]; updated[idx].title = e.target.value; setBookChapters(updated); }} className="px-3 py-2 border border-neutral-200 rounded-xl text-xs" />
                        <input type="text" placeholder="PPT or Google Slides URL" value={ch.url} onChange={(e) => { const updated = [...bookChapters]; updated[idx].url = e.target.value; setBookChapters(updated); }} className="px-3 py-2 border border-neutral-200 rounded-xl text-xs" />
                      </div>
                    ))}
                    <button type="button" onClick={() => setBookChapters([...bookChapters, { title: '', url: '' }])} className="text-xs font-bold text-[#FF2E7E] hover:underline pt-1 block">+ Add another chapter slot</button>
                  </div>
                )}

                <button type="submit" className={`px-5 py-2.5 ${t.accentBtn} rounded-xl text-xs font-bold transition`}>Create Book Folder</button>
              </form>
            </div>

            {booksList.length === 0 ? (
              <div className="p-12 text-center bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl">
                <p className="text-sm font-medium text-neutral-500">No books added yet. Add your first book above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {booksList.map((b) => (
                  <div key={b.id} className={`${t.cardBg} p-4 rounded-2xl shadow-xs border ${t.cardBorder} flex justify-between items-center`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📖</span>
                      <div>
                        <h3 className="font-bold text-sm text-neutral-900">{b.title}</h3>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-pink-50 text-[#FF2E7E] text-[10px] font-bold rounded uppercase tracking-wider">{b.type === 'page-based' ? 'PAGE-BASED' : 'CHAPTER-BASED'} ({b.pages || '100 PAGES'})</span>
                      </div>
                    </div>
                    <button onClick={() => setBooksList(booksList.filter(item => item.id !== b.id))} className="text-neutral-400 hover:text-red-500 font-bold p-2">🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && !selectedStudent && (
          <div className="space-y-6">
            <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} flex justify-between items-center`}>
              <div>
                <h1 className="text-2xl font-black text-neutral-900">Payments & Invoicing 💳</h1>
                <p className="text-sm text-neutral-500 mt-0.5">Record class package transactions, track gross & net earnings after transfer fees.</p>
              </div>
              <button onClick={() => setShowPaymentModal(true)} className={`px-4 py-2 ${t.accentBtn} rounded-xl text-sm font-bold shadow-xs transition`}>+ Record Payment</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}>
                <span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>NET REVENUE (LESS FEES)</span>
                <p className={`text-2xl font-black ${t.currencyColor} mt-2`}>₱0 PHP</p>
                <p className="text-xs text-neutral-400 mt-1">Gross: ₱0 | Fees: ₱0</p>
              </div>
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}>
                <span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>TOTAL TRANSACTIONS</span>
                <p className="text-2xl font-black text-neutral-900 mt-2">{paymentsList.length} Logs</p>
                <p className="text-xs text-neutral-400 mt-1">0 Completed</p>
              </div>
              <div className={`${t.cardBg} p-5 rounded-2xl shadow-xs border ${t.cardBorder}`}>
                <span className={`text-[10px] font-bold ${t.textMuted} tracking-wider`}>PENDING INVOICES</span>
                <p className="text-2xl font-black text-neutral-900 mt-2">0 Awaiting</p>
                <p className="text-xs text-neutral-400 mt-1">Follow-up needed</p>
              </div>
            </div>

            <div className={`${t.cardBg} rounded-2xl shadow-xs border ${t.cardBorder} overflow-hidden`}>
              <div className="p-4 border-b border-neutral-100 flex gap-2">
                <button className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg ${t.accentBtn}`}>All (0)</button>
                <button className="px-3 py-1.5 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-lg">Paid (0)</button>
                <button className="px-3 py-1.5 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-lg">Pending (0)</button>
              </div>

              {paymentsList.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm font-medium text-neutral-500">No payment logs recorded yet. Click "+ Record Payment" to start tracking.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 text-neutral-400 uppercase font-bold border-b border-neutral-100">
                      <tr>
                        <th className="p-4">Student</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Original Amount</th>
                        <th className="p-4">Net PHP Earned</th>
                        <th className="p-4">Method & Ref</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {paymentsList.map((p) => (
                        <tr key={p.id} className="hover:bg-neutral-50/50">
                          <td className="p-4 font-bold text-neutral-900">{p.student}</td>
                          <td className="p-4 text-neutral-500">{p.date}</td>
                          <td className="p-4 font-medium text-neutral-800">{p.originalAmount}</td>
                          <td className={`p-4 font-bold ${t.currencyColor}`}>{p.netPhp}</td>
                          <td className="p-4 text-neutral-600">{p.method}</td>
                          <td className="p-4"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px]">{p.status}</span></td>
                          <td className="p-4 text-right space-x-2">
                            <button onClick={() => setPaymentsList(paymentsList.filter(item => item.id !== p.id))} className="text-red-400 hover:text-red-600 font-bold">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && !selectedStudent && (
          <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder}`}>
            <h1 className="text-2xl font-black text-neutral-900 mb-1">📈 Performance Reports</h1>
            <p className="text-sm text-neutral-500 mb-6">Monthly analytics on teaching hours, income tax tracking, and financial statements</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-neutral-50/50 rounded-2xl border border-neutral-200"><h3 className="font-bold text-neutral-800 mb-2">Total Monthly Hours</h3><p className={`text-3xl font-black ${t.currencyColor}`}>0.0 hrs</p></div>
              <div className="p-6 bg-neutral-50/50 rounded-2xl border border-neutral-200"><h3 className="font-bold text-neutral-800 mb-2">Total Monthly Revenue</h3><p className={`text-3xl font-black ${t.currencyColor}`}>₱0</p></div>
            </div>
          </div>
        )}

        {/* ACCOUNT SETTINGS TAB */}
        {activeTab === 'settings' && !selectedStudent && (
          <div className={`${t.cardBg} p-6 rounded-2xl shadow-xs border ${t.cardBorder} max-w-2xl`}>
            <h1 className="text-2xl font-black text-neutral-900 mb-1">⚙️ Account Settings</h1>
            <p className="text-sm text-neutral-500 mb-6">Manage profile, currency, and dashboard appearance theme</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Dashboard Theme Customizer</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button onClick={() => handleThemeChange('teal')} className={`p-3 rounded-xl border text-left font-medium text-sm transition ${theme === 'teal' ? 'border-teal-600 bg-teal-50/50 text-teal-900 ring-2 ring-teal-600/20' : 'border-neutral-200 bg-white text-neutral-700'}`}>🌿 Modern Teal</button>
                  <button onClick={() => handleThemeChange('charcoal')} className={`p-3 rounded-xl border text-left font-medium text-sm transition ${theme === 'charcoal' ? 'border-amber-600 bg-amber-50/50 text-neutral-900 ring-2 ring-amber-600/20' : 'border-neutral-200 bg-white text-neutral-700'}`}>💼 Charcoal & Amber</button>
                  <button onClick={() => handleThemeChange('indigo')} className={`p-3 rounded-xl border text-left font-medium text-sm transition ${theme === 'indigo' ? 'border-indigo-600 bg-indigo-50/50 text-neutral-900 ring-2 ring-indigo-600/20' : 'border-neutral-200 bg-white text-neutral-700'}`}>🎓 Ocean Indigo</button>
                  <button onClick={() => handleThemeChange('pink')} className={`p-3 rounded-xl border text-left font-medium text-sm transition ${theme === 'pink' ? 'border-[#FF2E7E] bg-pink-50/50 text-neutral-900 ring-2 ring-pink-600/20' : 'border-neutral-200 bg-white text-neutral-700'}`}>🌸 Vibrant Pink</button>
                  <button onClick={() => handleThemeChange('colorful')} className={`p-3 rounded-xl border text-left font-medium text-sm transition ${theme === 'colorful' ? 'border-purple-600 bg-purple-50/50 text-neutral-900 ring-2 ring-purple-600/20' : 'border-neutral-200 bg-white text-neutral-700'}`}>🌈 Colorful Gradient</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Dashboard Currency Symbol</label>
                <select 
                  value={dashboardCurrency} 
                  onChange={(e) => handleCurrencyChange(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  <option value="₱">₱ - Philippine Peso (PHP)</option>
                  <option value="$">$ - US Dollar (USD)</option>
                  <option value="€">€ - Euro (EUR)</option>
                  <option value="£">£ - British Pound (GBP)</option>
                  <option value="¥">¥ - Japanese Yen (JPY)</option>
                  <option value="¥ (CNY)">¥ (CNY) - Chinese Yuan (CNY)</option>
                  <option value="₩">₩ - South Korean Won (KRW)</option>
                  <option value="₫">₫ - Vietnamese Dong (VND)</option>
                  <option value="฿">฿ - Thai Baht (THB)</option>
                  <option value="₹">₹ - Indian Rupee (INR)</option>
                  <option value="Rp">Rp - Indonesian Rupiah (IDR)</option>
                  <option value="RM">RM - Malaysian Ringgit (MYR)</option>
                  <option value="CHF">CHF - Swiss Franc (CHF)</option>
                  <option value="kr">kr - Swedish Krona (SEK)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Email Address</label>
                <input type="email" disabled value={user?.email || ''} className="w-full px-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-sm text-neutral-600" />
              </div>

              <button className={`px-5 py-2.5 ${t.accentBtn} rounded-xl text-sm font-bold transition`}>Save Changes</button>
            </div>
          </div>
        )}
      </main>

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <h2 className="text-lg font-black text-neutral-900">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-neutral-400 hover:text-neutral-700 font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Student Name *</label>
                <input type="text" required placeholder="e.g. Minh Nguyen" value={paymentStudent} onChange={(e) => setPaymentStudent(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Original Amount *</label>
                <input type="text" required placeholder="e.g. 1,500,000 VND" value={paymentAmountOriginal} onChange={(e) => setPaymentAmountOriginal(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Net PHP Earned *</label>
                <input type="text" required placeholder="e.g. ₱3,500 PHP" value={paymentNetPhp} onChange={(e) => setPaymentNetPhp(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-white">
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="GCash">GCash</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Wise">Wise</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-600">Cancel</button>
                <button type="submit" className={`px-5 py-2 ${t.accentBtn} rounded-xl text-sm font-bold`}>Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLASS STATUS MODAL */}
      {activeClassModal && !showLessonLogModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <h2 className="text-lg font-black text-neutral-900">Manage Class Status</h2>
              <button onClick={() => { setActiveClassModal(null); setMakeupChecked(false); }} className="text-neutral-400 hover:text-neutral-700 font-bold text-lg">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <p className="text-xs font-bold text-neutral-400 uppercase">Student & Schedule</p>
                <p className="text-base font-black text-neutral-900 mt-1">{activeClassModal.studentName}</p>
                <p className="text-xs text-neutral-600 mt-0.5">Date: <strong className="text-neutral-900">{activeClassModal.sessionDate}</strong> at <strong className="text-[#FF2E7E]">{activeClassModal.sessionTime}</strong></p>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">Select Attendance Status *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => handleSaveClassStatus('present')} className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1"><span className="text-base">✓</span> Present</button>
                  <button type="button" onClick={() => handleSaveClassStatus('absent')} className="p-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1"><span className="text-base">✗</span> Absent</button>
                  <button type="button" onClick={() => handleSaveClassStatus('cancelled')} className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1"><span className="text-base">⃠</span> Cancelled</button>
                </div>
              </div>
              <div className="pt-2 border-t border-neutral-100">
                <label className="flex items-center gap-2 text-xs font-bold text-neutral-700 cursor-pointer">
                  <input type="checkbox" checked={makeupChecked} onChange={(e) => setMakeupChecked(e.target.checked)} className="rounded text-[#FF2E7E] focus:ring-[#FF2E7E]" />
                  Schedule Make-up Class (+1 Rollover)
                </label>
                {makeupChecked && (
                  <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-pink-50/50 rounded-xl border border-pink-100">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 mb-1">Make-up Date</label>
                      <input type="date" value={makeupDate} onChange={(e) => setMakeupDate(e.target.value)} className="w-full px-2 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-600 mb-1">Make-up Time</label>
                      <input type="text" placeholder="17:20" value={makeupTime} onChange={(e) => setMakeupTime(e.target.value)} className="w-full px-2 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOG LESSON & HOMEWORK MODAL */}
      {showLessonLogModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <div>
                <h2 className="text-lg font-black text-neutral-900">Log Lesson & Homework</h2>
                <p className="text-xs text-neutral-500">Record daily lesson feedback and track curriculum progress.</p>
              </div>
              <button type="button" onClick={() => { setShowLessonLogModal(false); setActiveClassModal(null); }} className="text-neutral-400 hover:text-neutral-700 font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleSaveLessonLog} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Assigned Books & Progress</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 mb-1">Select Book</label>
                    <select value={lessonLogData.book} onChange={(e) => setLessonLogData({...lessonLogData, book: e.target.value})} className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs">
                      <option value="">-- Choose Book --</option>
                      {booksList.map((b) => (<option key={b.id} value={b.title}>{b.title}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 mb-1">Start Page</label>
                    <input type="text" placeholder="e.g. 1" value={lessonLogData.startPage} onChange={(e) => setLessonLogData({...lessonLogData, startPage: e.target.value})} className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 mb-1">End Page</label>
                    <input type="text" placeholder="e.g. 12" value={lessonLogData.endPage} onChange={(e) => setLessonLogData({...lessonLogData, endPage: e.target.value})} className="w-full px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Lesson Title *</label>
                  <input type="text" required placeholder="e.g. Unit 3: Animals & Habitats" value={lessonLogData.title} onChange={(e) => setLessonLogData({...lessonLogData, title: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Date</label>
                  <input type="date" value={lessonLogData.date} onChange={(e) => setLessonLogData({...lessonLogData, date: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Vocabulary / Target Patterns</label>
                <textarea rows={2} placeholder="e.g. cheetah, mammal, fast, faster than..." value={lessonLogData.vocabulary} onChange={(e) => setLessonLogData({...lessonLogData, vocabulary: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Strengths & Highlights</label>
                <textarea rows={2} placeholder="Great pronunciation today! You did a fantastic job sharing your opinions..." value={lessonLogData.strengths} onChange={(e) => setLessonLogData({...lessonLogData, strengths: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Next Focus / Improvement</label>
                <textarea rows={2} placeholder="Practice past tense verb endings..." value={lessonLogData.nextFocus} onChange={(e) => setLessonLogData({...lessonLogData, nextFocus: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Message from Teacher (Note to Parents)</label>
                <textarea rows={2} placeholder="Great job in our lesson today..." value={lessonLogData.teacherMessage} onChange={(e) => setLessonLogData({...lessonLogData, teacherMessage: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Assigned Homework / Instructions (Optional)</label>
                <textarea rows={2} placeholder="Instructions: Write one complete sentence for each vocabulary word..." value={lessonLogData.homework} onChange={(e) => setLessonLogData({...lessonLogData, homework: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button type="button" onClick={() => { setShowLessonLogModal(false); setActiveClassModal(null); }} className="px-4 py-2 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-600">Cancel</button>
                <button type="submit" className={`px-5 py-2 ${t.accentBtn} rounded-xl text-sm font-bold`}>Save Lesson Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <h2 className="text-lg font-black text-neutral-900">Edit Student Profile</h2>
              <button onClick={() => setShowEditModal(false)} className="text-neutral-400 hover:text-neutral-700 font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleUpdateStudent} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Student Name *</label><input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Assigned Teacher Alias</label><input type="text" value={editAlias} onChange={(e) => setEditAlias(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
              </div>
              <div><label className="block text-xs font-bold text-neutral-700 mb-1">Classroom Video Link (Zoom / Meet URL)</label><input type="text" value={editVideo} onChange={(e) => setEditVideo(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Email</label><input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Phone</label><input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Age</label><input type="text" value={editAge} onChange={(e) => setEditAge(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Country</label><select value={editCountry} onChange={(e) => setEditCountry(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-white">{countriesWithFlags.map((c, i) => (<option key={i} value={c}>{c}</option>))}</select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Payment Currency</label><select value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-white">{currenciesWithSymbols.map((curr, i) => (<option key={i} value={curr}>{curr}</option>))}</select></div>
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Payment Amount</label><input type="text" value={editPayment} onChange={(e) => setEditPayment(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Classes Included</label><input type="number" value={editClasses} onChange={(e) => setEditClasses(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Free Classes</label><input type="number" value={editFree} onChange={(e) => setEditFree(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Classes Completed</label><input type="number" value={editCompleted} onChange={(e) => setEditCompleted(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Duration (mins)</label><input type="text" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-600">Cancel</button>
                <button type="submit" className={`px-5 py-2 ${t.accentBtn} rounded-xl text-sm font-bold`}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <h2 className="text-lg font-black text-neutral-900">Add Student</h2>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-neutral-700 font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Student Name *</label><input type="text" required placeholder="e.g. An Nhien (Chip)" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Teacher Alias *</label><input type="text" placeholder="e.g. TEACHER GABI" value={teacherAlias} onChange={(e) => setTeacherAlias(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Country *</label><select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm bg-white">{countriesWithFlags.map((c, i) => (<option key={i} value={c}>{c}</option>))}</select></div>
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Currency / Rate *</label><input type="text" placeholder="e.g. ₫ 900,000 VND" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Classes Included</label><input type="number" value={classesIncluded} onChange={(e) => setClassesIncluded(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Free Classes (+)</label><input type="number" value={freeClasses} onChange={(e) => setFreeClasses(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Duration (e.g. 40m)</label><input type="text" value={classDuration} onChange={(e) => setClassDuration(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">PHP Approx (e.g. ₱2,169)</label><input type="text" value={phpApprox} onChange={(e) => setPhpApprox(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
                <div><label className="block text-xs font-bold text-neutral-700 mb-1">Contract Start Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-600">Cancel</button>
                <button type="submit" className={`px-5 py-2 ${t.accentBtn} rounded-xl text-sm font-bold`}>Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <h2 className="text-lg font-black text-neutral-900">Add Weekly Schedule</h2>
              <button onClick={() => setShowScheduleModal(false)} className="text-neutral-400 hover:text-neutral-700 font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleAddSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">Select Days *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <label key={day} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition ${selectedDays.includes(day) ? 'bg-pink-50 border-[#FF2E7E] text-[#FF2E7E]' : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'}`}>
                      <input type="checkbox" checked={selectedDays.includes(day)} onChange={() => handleDayToggle(day)} className="rounded text-[#FF2E7E] focus:ring-[#FF2E7E]" />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
              <div><label className="block text-xs font-bold text-neutral-700 mb-1">Class Time *</label><input type="text" required placeholder="e.g. 17:20" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm" /></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-4 py-2 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-600">Cancel</button>
                <button type="submit" className={`px-5 py-2 ${t.accentBtn} rounded-xl text-sm font-bold`}>Add Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}