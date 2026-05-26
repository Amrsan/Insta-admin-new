/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import {
  Calendar,
  Briefcase,
  Bell,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Menu,
  User,
  ExternalLink,
  DollarSign,
  AlertCircle,
  MapPin,
  Phone,
  Clock,
  ChevronDown,
  Inbox,
  Send,
  MoreVertical,
  Download
} from 'lucide-react';

// --- Types ---

export type BookingStatus = string;
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Refunded';

export interface Booking {
  id: string;
  patient_name: string;
  contact_number: string;
  service_name: string;
  address: string;
  amount: number;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  booking_date: string;
  booking_time: string;
  notes: string;
  email?: string;
  created_at?: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  image_url?: string;
}

export interface NotificationLog {
  id: string;
  user_id: string; // Recipient name
  title: string;
  message: string;
  sent_at: string;
}

// --- Constants ---

const SUGGESTED_CATEGORIES = [
  'Doctor Visit',
  'Home Care',
  'Emergency',
  'Consultation',
  'Laboratory',
  'Nursing',
  'Physiotherapy'
];

// --- Initial Mock Data ---

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'B001',
    patient_name: 'Emily Watson',
    contact_number: '+1 (555) 234-5678',
    service_name: 'Doctor Visit',
    address: '742 Evergreen Terrace, Springfield',
    amount: 150.00,
    payment_status: 'Paid',
    booking_status: 'Pending',
    booking_date: '2026-05-24',
    booking_time: '10:00 AM',
    notes: 'Needs assistance with walking. Routine senior checkup.'
  },
  {
    id: 'B002',
    patient_name: 'John Doe',
    contact_number: '+1 (555) 987-6543',
    service_name: 'Physiotherapy',
    address: '123 Maple Street, Riverdale',
    amount: 90.00,
    payment_status: 'Paid',
    booking_status: 'In Progress',
    booking_date: '2026-05-23',
    booking_time: '02:30 PM',
    notes: 'Recovery session post ankle fracture. Bring therabands.'
  },
  {
    id: 'B003',
    patient_name: 'Sarah Jenkins',
    contact_number: '+1 (555) 456-7890',
    service_name: 'Laboratory',
    address: '456 Oak Avenue, Metropolis',
    amount: 65.00,
    payment_status: 'Paid',
    booking_status: 'Done',
    booking_date: '2026-05-20',
    booking_time: '08:00 AM',
    notes: 'Annual blood panel and fasting glucose tests.'
  },
  {
    id: 'B004',
    patient_name: 'Michael Chang',
    contact_number: '+1 (555) 321-0987',
    service_name: 'Emergency',
    address: '888 Dragon Lane, Chinatown',
    amount: 350.00,
    payment_status: 'Refunded',
    booking_status: 'Cancelled',
    booking_date: '2026-05-18',
    booking_time: '11:15 PM',
    notes: 'Patient called back to cancel, went directly to hospital.'
  },
  {
    id: 'B005',
    patient_name: 'Robert Miller',
    contact_number: '+1 (555) 111-2222',
    service_name: 'Home Care',
    address: '12 West Side Road, Brooklyn',
    amount: 120.00,
    payment_status: 'Unpaid',
    booking_status: 'Pending',
    booking_date: '2026-05-25',
    booking_time: '09:15 AM',
    notes: 'Physically disabled client support. Assist with groceries and meals.'
  },
  {
    id: 'B006',
    patient_name: 'Lily Alvarez',
    contact_number: '+1 (555) 888-9999',
    service_name: 'Consultation',
    address: '909 Summit View, Seattle',
    amount: 80.00,
    payment_status: 'Paid',
    booking_status: 'Done',
    booking_date: '2026-05-15',
    booking_time: '04:00 PM',
    notes: 'Mental wellness check-in and coping techniques review.'
  },
  {
    id: 'B007',
    patient_name: 'David Kim',
    contact_number: '+1 (555) 777-6666',
    service_name: 'Nursing',
    address: '34 Horizon Blvd, San Francisco',
    amount: 110.00,
    payment_status: 'Unpaid',
    booking_status: 'Pending',
    booking_date: '2026-05-26',
    booking_time: '11:00 AM',
    notes: 'Post-operative dressing change and vitals log.'
  }
];

const INITIAL_NOTIFICATIONS: NotificationLog[] = [
  {
    id: 'N001',
    user_id: 'Emily Watson',
    title: 'Booking Confirmed',
    message: 'Hello Emily Watson, your Doctor Visit appointment scheduled for May 24th has been successfully logged.',
    sent_at: '2026-05-23 09:15 AM'
  },
  {
    id: 'N002',
    user_id: 'Michael Chang',
    title: 'Refund Processed Callback',
    message: 'Your emergency cancellation refund of $350.00 has been credited to your card on file.',
    sent_at: '2026-05-22 02:40 PM'
  }
];

export default function App() {
  // --- States ---

  // Test Supabase connection on mount
  useEffect(() => {
    async function testSupabaseConnection() {
      try {
        // Try to fetch from the 'bookings' table
        const { data, error } = await supabase.from('bookings').select('*').limit(1);
        if (error) {
          console.error('Supabase connection error:', error.message);
        } else {
          console.log('Supabase connection successful:', data);
        }
      } catch (err) {
        console.error('Supabase connection exception:', err);
      }
    }
    testSupabaseConnection();
  }, []);
  const [activeTab, setActiveTab] = useState<'bookings' | 'services' | 'notifications'>('bookings');
  

  // Bookings state: fetch from Supabase on mount
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookings() {
      setBookingsLoading(true);
      setBookingsError(null);
      const { data, error } = await supabase
        .from('bookings')
        .select('*, addresses:address_id(*), services:service_id(*)')
        .order('created_at', { ascending: false });
      if (error) {
        setBookingsError(error.message);
        setBookings([]);
      } else {
        // Map 'status' from Supabase to 'booking_status', combine address fields, and add service info
        const mapped = (data || []).map((b: any) => {
          const addr = b.addresses;
          const addressString = addr
            ? [
                addr.government,
                addr.city,
                addr.street,
                addr.building_no && `Bldg ${addr.building_no}`,
                addr.floor_no && `Floor ${addr.floor_no}`,
                addr.apartment_no && `Apt ${addr.apartment_no}`
              ]
                .filter(Boolean)
                .join(', ')
            : '';

          const svc = b.services;
          const serviceString = svc
            ? [svc.name, svc.category].filter(Boolean).join(' - ')
            : '';

          const rawStatus = b.booking_status ?? b.status ?? 'Pending';

          return {
            ...b,
            booking_status: rawStatus,
            address: addressString,
            service_name: serviceString || b.service_name || '',
            amount : typeof b.fee === 'object' && b.fee  !== null ? (b.fee.amount ?? b.fee.fee ?? 0) : (b.fee ?? b.amount ?? 0),
            created_at: b.created_at,
          };
        });
        setBookings(mapped);
      }
      setBookingsLoading(false);
    }
    fetchBookings();
  }, []);

  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    async function fetchServices() {
      const { data, error } = await supabase.from('services').select('*');
      if (error) {
        console.error('Error fetching services:', error.message);
      } else {
        setServices(data as Service[] || []);
      }
    }
    fetchServices();
  }, []);

  const [notifications, setNotifications] = useState<NotificationLog[]>(() => {
    const local = localStorage.getItem('admin_dashboard_notifications');
    return local ? JSON.parse(local) : INITIAL_NOTIFICATIONS;
  });


  // (Optional) Remove localStorage sync for bookings

  useEffect(() => {
    localStorage.setItem('admin_dashboard_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Mobile menu open
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- Bookings Search, Filters, Sorting & Pagination States ---
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('All');
  const [bookingSortOrder, setBookingSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [bookingCurrentPage, setBookingCurrentPage] = useState(1);
  const bookingsPerPage = 5;

  // --- Service Modals ---
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: SUGGESTED_CATEGORIES[0],
    description: '',
    price: '',
    image_url: ''
  });

  const [activeEditService, setActiveEditService] = useState<Service | null>(null);
  const [activeDeleteService, setActiveDeleteService] = useState<Service | null>(null);

  // --- Booking Modals ---
  const [activeEditBooking, setActiveEditBooking] = useState<Booking | null>(null);
  const [activeViewBooking, setActiveViewBooking] = useState<Booking | null>(null);
  const [activeStatusEditBooking, setActiveStatusEditBooking] = useState<Booking | null>(null);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  
  // --- Row Colors State ---
  const [rowColors, setRowColors] = useState<Record<string, 'green' | 'red' | null>>(() => {
    const local = localStorage.getItem('admin_dashboard_row_colors');
    return local ? JSON.parse(local) : {};
  });

  useEffect(() => {
    localStorage.setItem('admin_dashboard_row_colors', JSON.stringify(rowColors));
  }, [rowColors]);

  const [bookingForm, setBookingForm] = useState({
    patient_name: '',
    contact_number: '',
    service_name: '',
    address: '',
    amount: '',
    payment_status: 'Unpaid' as PaymentStatus,
    booking_status: 'Pending' as BookingStatus,
    booking_date: '',
    booking_time: '',
    notes: ''
  });

  // --- Notifications States ---
  const [notificationTargetUser, setNotificationTargetUser] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationFeedback, setNotificationFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // --- BOOKING STATS COMPUTATION ---
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    bookings.forEach(b => {
      if (b.booking_status) statuses.add(b.booking_status);
    });
    return Array.from(statuses).sort();
  }, [bookings]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach((b) => {
      const s = b.booking_status || 'Pending';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [bookings]);

  // --- BOOKINGS TABLE SELECTION & COMPILATION ---
  const processedBookings = useMemo(() => {
    let result = [...bookings];

    // Search filter
    if (bookingSearch.trim()) {
      const searchLower = bookingSearch.toLowerCase();
      result = result.filter(
        (b) =>
          b.patient_name.toLowerCase().includes(searchLower) ||
          b.service_name.toLowerCase().includes(searchLower) ||
          b.contact_number.toLowerCase().includes(searchLower) ||
          b.address.toLowerCase().includes(searchLower) ||
          (b.notes && b.notes.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (bookingStatusFilter !== 'All') {
      result = result.filter((b) => b.booking_status === bookingStatusFilter);
    }

    // Sort order
    result.sort((a, b) => {
      const dateA = new Date(a.created_at || `${a.booking_date} ${a.booking_time || '00:00 AM'}`).getTime();
      const dateB = new Date(b.created_at || `${b.booking_date} ${b.booking_time || '00:00 AM'}`).getTime();
      return bookingSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [bookings, bookingSearch, bookingStatusFilter, bookingSortOrder]);

  // Paginated Bookings
  const paginatedBookings = useMemo(() => {
    const startIndex = (bookingCurrentPage - 1) * bookingsPerPage;
    return processedBookings.slice(startIndex, startIndex + bookingsPerPage);
  }, [processedBookings, bookingCurrentPage]);

  const totalBookingPages = Math.max(1, Math.ceil(processedBookings.length / bookingsPerPage));

  // If page index overflows after filter, reset it
  useEffect(() => {
    if (bookingCurrentPage > totalBookingPages) {
      setBookingCurrentPage(1);
    }
  }, [totalBookingPages, bookingCurrentPage]);

  // --- RECIPIENT USERS ---
  const usersList = useMemo(() => {
    // Collect from patient bookings as well as unique names
    const names = new Set<string>();
    bookings.forEach((b) => names.add(b.patient_name));
    // Add standard additional list
    const defaults = ['Emily Watson', 'John Doe', 'Sarah Jenkins', 'Michael Chang', 'Robert Miller', 'Lily Alvarez', 'David Kim', 'Alice Peterson', 'Grace Hopper'];
    defaults.forEach((name) => names.add(name));
    return Array.from(names).sort();
  }, [bookings]);

  // Ensure default notification target selected
  useEffect(() => {
    if (usersList.length > 0 && !notificationTargetUser) {
      setNotificationTargetUser(usersList[0]);
    }
  }, [usersList, notificationTargetUser]);

  // --- ACTIONS: BOOKING UTILITIES ---

  const handleCreateBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.patient_name.trim()) return;

    const matchedService = services.find(s => s.name === bookingForm.service_name);
    const amountVal = bookingForm.amount ? parseFloat(bookingForm.amount) : (matchedService ? Number(matchedService.price) : 0);

    const newBooking: Booking = {
      id: `B${String(bookings.length + 1).padStart(3, '0')}-${Math.floor(100 + Math.random() * 900)}`,
      patient_name: bookingForm.patient_name.trim(),
      contact_number: bookingForm.contact_number.trim() || '+1 (555) 000-0000',
      service_name: bookingForm.service_name,
      address: bookingForm.address.trim() || 'No address specified',
      amount: amountVal,
      payment_status: bookingForm.payment_status,
      booking_status: bookingForm.booking_status,
      booking_date: bookingForm.booking_date || new Date().toISOString().split('T')[0],
      booking_time: bookingForm.booking_time || '12:00 PM',
      notes: bookingForm.notes.trim(),
      created_at: new Date().toISOString()
    };

    setBookings((prev) => [newBooking, ...prev]);
    setIsAddBookingOpen(false);

    // Reset Form
    setBookingForm({
      patient_name: '',
      contact_number: '',
      service_name: services[0]?.name || '',
      address: '',
      amount: '',
      payment_status: 'Unpaid',
      booking_status: 'Pending',
      booking_date: '',
      booking_time: '',
      notes: ''
    });
  };

  const updateBookingDetails = (updated: Booking) => {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setActiveEditBooking(null);
  };

  const deleteBookingItem = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    if (activeViewBooking?.id === id) {
      setActiveViewBooking(null);
    }
  };

  const handleQuickStatusUpdate = (color: 'green' | 'red' | null) => {
    if (!activeStatusEditBooking) return;
    setRowColors((prev) => {
      const newColors = { ...prev };
      if (color === null) {
        delete newColors[activeStatusEditBooking.id];
      } else {
        newColors[activeStatusEditBooking.id] = color;
      }
      return newColors;
    });
    setActiveStatusEditBooking(null);
  };

  const handleExportCSV = () => {
    if (processedBookings.length === 0) return;

    const headers = [
      'ID',
      'Status',
      'Created At',
      'Patient Name',
      'Contact Number',
      'Service Name',
      'Patient Address',
      'Amount',
      'Payment Status',
      'Booking Date',
      'Booking Time',
      'Notes'
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = processedBookings.map((b) => [
      escapeCSV(b.id),
      escapeCSV(b.booking_status),
      escapeCSV(b.created_at ? new Date(b.created_at).toLocaleString() : ''),
      escapeCSV(b.patient_name),
      escapeCSV(b.contact_number),
      escapeCSV(b.service_name),
      escapeCSV(b.address),
      escapeCSV(b.amount),
      escapeCSV(b.payment_status),
      escapeCSV(b.booking_date),
      escapeCSV(b.booking_time),
      escapeCSV(b.notes || '')
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- ACTIONS: SERVICES UTILES ---

  const handleAddServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim() || !serviceForm.price) return;

    const newService = {
      name: serviceForm.name.trim(),
      category: serviceForm.category,
      description: serviceForm.description.trim() || 'No description provided.',
      price: parseFloat(serviceForm.price) || 0,
      image_url: serviceForm.image_url.trim()
    };

    const { data, error } = await supabase.from('services').insert([newService]).select();
    if (error) {
      console.error('Error adding service:', error.message);
      return;
    }

    if (data) {
      setServices((prev) => [...prev, data[0] as Service]);
    }
    setIsAddServiceOpen(false);
    setServiceForm({
      name: '',
      category: SUGGESTED_CATEGORIES[0],
      description: '',
      price: '',
      image_url: ''
    });
  };

  const handleEditServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditService) return;
    if (!activeEditService.name.trim() || !activeEditService.price) return;

    const { data, error } = await supabase
      .from('services')
      .update({
        name: activeEditService.name,
        category: activeEditService.category,
        description: activeEditService.description,
        price: activeEditService.price,
        image_url: activeEditService.image_url
      })
      .eq('id', activeEditService.id)
      .select();

    if (error) {
      console.error('Error updating service:', error.message);
      return;
    }

    if (data) {
      setServices((prev) =>
        prev.map((s) => (s.id === activeEditService.id ? (data[0] as Service) : s))
      );
    }
    setActiveEditService(null);
  };

  const handleDeleteServiceConfirm = async () => {
    if (!activeDeleteService) return;
    
    const { error } = await supabase.from('services').delete().eq('id', activeDeleteService.id);
    if (error) {
      console.error('Error deleting service:', error.message);
      return;
    }

    setServices((prev) => prev.filter((s) => s.id !== activeDeleteService.id));
    setActiveDeleteService(null);
  };

  // --- ACTIONS: NOTIFICATIONS UTILITIES ---

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    setNotificationFeedback(null);

    if (!notificationTargetUser) {
      setNotificationFeedback({
        type: 'error',
        text: 'Please select a recipient user.'
      });
      return;
    }
    if (!notificationTitle.trim()) {
      setNotificationFeedback({
        type: 'error',
        text: 'Notification title is required.'
      });
      return;
    }
    if (!notificationMessage.trim()) {
      setNotificationFeedback({
        type: 'error',
        text: 'Notification message cannot be empty.'
      });
      return;
    }

    // Success response
    const newLog: NotificationLog = {
      id: `N${String(notifications.length + 1).padStart(3, '0')}-${Math.floor(100 + Math.random() * 900)}`,
      user_id: notificationTargetUser,
      title: notificationTitle.trim(),
      message: notificationMessage.trim(),
      sent_at: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };

    setNotifications((prev) => [newLog, ...prev]);
    setNotificationFeedback({
      type: 'success',
      text: `Notification successfully broadcasted to ${notificationTargetUser}!`
    });

    // Clear message fields but retain user targeting for ease of use
    setNotificationTitle('');
    setNotificationMessage('');

    // Clear feedback toast after 5 seconds automatically
    setTimeout(() => {
      setNotificationFeedback(null);
    }, 6000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans" id="app_root_layout">
      
      {/* HEADER BAR FOR MOBILE */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-md" id="mobile_header_panel">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500 text-slate-900 rounded-lg p-2 font-black tracking-wider text-sm shadow-inner" id="mobile_logo_badge">
            A.D.
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">MedDash Admin</h1>
            <p className="text-[10px] text-slate-400 font-medium">AmrIbrahim924@gmail.com</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 hover:bg-slate-800 transition"
          id="mobile_hamburger_toggle"
          aria-label="Toggle Navigation Side Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* PAGE CONTAINER */}
      <div className="flex flex-1 relative" id="layout_panel_split">
        
        {/* SIDE BAR NAVIGATION */}
        <aside
          className={`
            fixed md:sticky top-[64px] md:top-0 h-[calc(100vh-64px)] md:h-screen w-72 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out z-30 shadow-2xl md:shadow-none border-r border-slate-800
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
          id="sidebar_nav_navigation"
        >
          {/* Logo & Identity */}
          <div className="p-6 border-b border-slate-800">
            <div className="hidden md:flex items-center gap-3 mb-6" id="desktop_logo_container">
              <div className="bg-teal-400 text-slate-950 font-black rounded-xl p-2.5 shadow-md flex items-center justify-center text-lg w-10 h-10">
                MD
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-wide">MedDash</h1>
                <p className="text-xs text-slate-400 font-bold tracking-tight">Management Suite</p>
              </div>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50" id="user_profile_pill">
              <div className="flex items-center gap-3">
                <div className="bg-slate-700 p-2 rounded-lg text-teal-400 font-bold text-sm">
                  AI
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-slate-400 font-medium">Administrator</p>
                  <p className="text-sm font-semibold truncate text-slate-100" title="AmrIbrahim924@gmail.com">
                    AmrIbrahim924@gmail.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto" id="dashboard_tabs_navigation">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 mb-2">Main Navigation</p>
            
            <button
              id="navigation_tab_bookings"
              onClick={() => {
                setActiveTab('bookings');
                setMobileMenuOpen(false);
              }}
              className={`
                w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all group duration-200
                ${activeTab === 'bookings'
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }
              `}
            >
              <Calendar size={18} className={activeTab === 'bookings' ? 'text-slate-950' : 'text-slate-400 group-hover:text-white'} />
              <span>Bookings Management</span>
            </button>

            <button
              id="navigation_tab_services"
              onClick={() => {
                setActiveTab('services');
                setMobileMenuOpen(false);
              }}
              className={`
                w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all group duration-200
                ${activeTab === 'services'
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }
              `}
            >
              <Briefcase size={18} className={activeTab === 'services' ? 'text-slate-950' : 'text-slate-400 group-hover:text-white'} />
              <span>Services Management</span>
            </button>

            <button
              id="navigation_tab_notifications"
              onClick={() => {
                setActiveTab('notifications');
                setMobileMenuOpen(false);
              }}
              className={`
                w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all group duration-200
                ${activeTab === 'notifications'
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }
              `}
            >
              <Bell size={18} className={activeTab === 'notifications' ? 'text-slate-950' : 'text-slate-400 group-hover:text-white'} />
              <span>Notifications Broadcasting</span>
            </button>
          </nav>

          {/* Sidebar Footer Info */}
          <div className="p-6 border-t border-slate-800 bg-slate-950/40 text-center" id="sidebar_version_badge">
            <p className="text-[11px] text-slate-500 font-medium">MedDash Console Admin v2.4.0</p>
            <p className="text-[10px] text-teal-400/80 font-bold mt-1">● System Connected Room</p>
          </div>
        </aside>

        {/* MAIN BODY SCROLL VIEW */}
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-64px)] md:min-h-screen bg-slate-100 flex flex-col" id="master_content_container">
          
          {/* HEADER TOP DECORATION */}
          <section className="bg-white border-b border-slate-200 py-6 px-4 sm:px-8 hidden md:flex items-center justify-between shadow-sm" id="desktop_top_panel">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight" id="main_pane_title">
                {activeTab === 'bookings' && 'Bookings Management'}
                {activeTab === 'services' && 'Services Directory'}
                {activeTab === 'notifications' && 'System Notifications'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {activeTab === 'bookings' && 'Track client requests, update statuses, monitor payment records and notes.'}
                {activeTab === 'services' && 'Configure therapeutic classes, update clinic services catalog or prices.'}
                {activeTab === 'notifications' && 'Publish real-time system alerts and broadcast messages to specific patients.'}
              </p>
            </div>
            
            {/* Quick Stats Pill */}
            <div className="flex items-center gap-6" id="top_quick_actions_indicators">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Database Records</p>
                <p className="text-sm font-semibold text-slate-700">{bookings.length} Bookings | {services.length} Services</p>
              </div>
              <div className="border-l border-slate-200 h-8"></div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
                <CheckCircle size={14} />
                <span>Active Server Sync</span>
              </div>
            </div>
          </section>

          {/* MAIN TAB SWITCH VIEW */}
          <div className="flex-1 p-4 sm:p-8" id="tab_contents_container">
            
            {/* 1. BOOKINGS MANAGEMENT TAB */}
            {activeTab === 'bookings' && (
              <div className="space-y-8" id="bookings_tab_view">
                
                {/* DYNAMIC SUMMARY STATS CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch" id="stats_summary_grid">
                  
                  {/* Total Card */}
                  <div 
                    className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex items-center justify-between hover:shadow-md transition group duration-200 cursor-pointer" 
                    id="card_total"
                    onClick={() => {
                      setBookingStatusFilter('All');
                      setBookingCurrentPage(1);
                    }}
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Requests</p>
                      <h3 className="text-3xl font-extrabold text-slate-900">{bookings.length}</h3>
                      <p className="text-[10px] text-indigo-600 font-medium tracking-tight">Cumulative count</p>
                    </div>
                    <div className="bg-indigo-100 text-indigo-700 p-3.5 rounded-xl group-hover:scale-110 transition duration-300">
                      <Calendar size={22} className="stroke-[2.5]" />
                    </div>
                  </div>

                  {/* Dynamic Status Cards */}
                  {uniqueStatuses.slice(0, 3).map((status, idx) => {
                    const count = statusCounts[status] || 0;
                    const styles = [
                      { bg: 'bg-amber-100', text: 'text-amber-700', iconText: 'text-amber-600' },
                      { bg: 'bg-emerald-100', text: 'text-emerald-700', iconText: 'text-emerald-600' },
                      { bg: 'bg-rose-100', text: 'text-rose-700', iconText: 'text-rose-600' },
                    ];
                    const style = styles[idx % styles.length];

                    return (
                      <div 
                        key={status}
                        className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex items-center justify-between hover:shadow-md transition group duration-200 cursor-pointer" 
                        id={`card_status_${status.replace(/\s+/g, '_')}`}
                        onClick={() => {
                          setBookingStatusFilter(status);
                          setBookingCurrentPage(1);
                        }}
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 truncate max-w-[120px]">{status} Requests</p>
                          <h3 className="text-3xl font-extrabold text-slate-900">{count}</h3>
                          <p className={`text-[10px] ${style.iconText} font-medium tracking-tight truncate`}>Status: {status}</p>
                        </div>
                        <div className={`${style.bg} ${style.text} p-3.5 rounded-xl group-hover:scale-110 transition duration-300`}>
                          <Clock size={22} className="stroke-[2.5]" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ADVANCED TABLE CONTROLS Panel */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs" id="bookings_panel_card">
                  
                  {/* Top Bar inside Card: search, filter status, reset */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center" id="bookings_table_header_actions">
                    
                    <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
                      {/* Search bar */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          id="search_bookings_field"
                          type="text"
                          placeholder="Search patient, contact, service or address..."
                          value={bookingSearch}
                          onChange={(e) => {
                            setBookingSearch(e.target.value);
                            setBookingCurrentPage(1); // reset to page 1 on search
                          }}
                          className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                        />
                        {bookingSearch && (
                          <button
                            onClick={() => setBookingSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>

                      {/* Status Filter */}
                      <div className="relative min-w-[170px]" id="status_filter_wrapper">
                        <select
                          id="status_filter_dropdown"
                          value={bookingStatusFilter}
                          onChange={(e) => {
                            setBookingStatusFilter(e.target.value);
                            setBookingCurrentPage(1);
                          }}
                          className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white appearance-none transition"
                        >
                          <option value="All">All Booking Statuses</option>
                          {uniqueStatuses.map((status) => (
                            <option key={status} value={status}>{status} Only</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>

                      {/* Sorter */}
                      <div className="relative min-w-[150px]" id="sort_filter_wrapper">
                        <select
                          id="sort_order_dropdown"
                          value={bookingSortOrder}
                          onChange={(e) => setBookingSortOrder(e.target.value as 'newest' | 'oldest')}
                          className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white appearance-none transition"
                        >
                          <option value="newest">Newest Booking</option>
                          <option value="oldest">Oldest Booking</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Left Actions e.g. "Add Manual Booking" */}
                    <div className="flex items-center gap-2" id="utility_table_buttons">
                      {bookingStatusFilter !== 'All' || bookingSearch !== '' ? (
                        <button
                          onClick={() => {
                            setBookingStatusFilter('All');
                            setBookingSearch('');
                          }}
                          className="px-3.5 py-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-100 rounded-lg transition"
                          id="reset_filters_btn"
                        >
                          Reset Filters
                        </button>
                      ) : null}

                      <button
                        onClick={handleExportCSV}
                        disabled={processedBookings.length === 0}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        id="export_bookings_csv_btn"
                        title="Export filtered records to CSV"
                      >
                        <Download size={16} />
                        <span>Export CSV</span>
                      </button>

                      <button
                        onClick={() => setIsAddBookingOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition shadow-xs"
                        id="add_new_booking_btn"
                      >
                        <Plus size={16} className="stroke-[2.5]" />
                        <span>Add Booking</span>
                      </button>
                    </div>

                  </div>

                  {/* RESPONSIVE TABLE GRID */}
                  <div className="overflow-auto max-h-[600px]" id="bookings_table_wrapper">
                    {paginatedBookings.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center" id="empty_search_state">
                        <Inbox size={40} className="text-slate-300 mb-3" />
                        <p className="text-base font-bold">No booking requests found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your filters, search term, or create a brand new booking record.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse" id="bookings_data_table">
                        <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                          <tr className="border-b border-slate-200 uppercase text-[10px] font-bold tracking-widest text-slate-500">
                            <th className="px-5 py-4 whitespace-nowrap bg-slate-50">Status</th>
                            <th className="px-5 py-4 whitespace-nowrap bg-slate-50">Created At</th>
                            <th className="px-5 py-4 whitespace-nowrap bg-slate-50">Patient Details</th>
                            <th className="px-5 py-4 whitespace-nowrap bg-slate-50">Booking Info</th>
                            <th className="px-5 py-4 whitespace-nowrap bg-slate-50">Address</th>
                            <th className="px-5 py-4 text-right whitespace-nowrap bg-slate-50">Fee Due</th>
                            <th className="px-5 py-4 whitespace-nowrap bg-slate-50">Payment</th>
                            <th className="px-5 py-4 whitespace-nowrap bg-slate-50">Notes</th>
                            <th className="px-5 py-4 text-center whitespace-nowrap bg-slate-50">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {paginatedBookings.map((b) => {
                            const statusLower = String(b.booking_status).toLowerCase();
                            const rowColor = rowColors[b.id];
                            
                            const isDone = statusLower.includes('done') || statusLower.includes('complete');
                            const isCancel = statusLower.includes('cancel') || statusLower.includes('fail');
                            const isPending = statusLower.includes('pend') || statusLower.includes('wait');
                            const isProgress = statusLower.includes('progress') || statusLower.includes('active');

                            let rowClass = 'hover:bg-slate-50/50';
                            let badgeClass = 'bg-slate-50 text-slate-800 border-slate-200';
                            
                            if (rowColor === 'green') {
                              rowClass = 'bg-green-100 hover:bg-green-200';
                              badgeClass = 'bg-green-200 text-green-800 border-green-300';
                            } else if (rowColor === 'red') {
                              rowClass = 'bg-red-100 hover:bg-red-200';
                              badgeClass = 'bg-rose-50 text-rose-800 border-rose-200';
                            } else {
                              if (isDone) badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                              else if (isCancel) badgeClass = 'bg-rose-50 text-rose-800 border-rose-200';
                              else if (isPending) badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                              else if (isProgress) badgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
                            }

                            return (
                              <tr key={b.id} className={`transition duration-150 ${rowClass}`} id={`booking_row_${b.id}`}>
                              {/* Status Column */}
                              <td className="px-5 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => setActiveStatusEditBooking(b)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold leading-none uppercase tracking-wide border cursor-pointer hover:shadow-sm hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${badgeClass}`}
                                    id={`status_badge_${b.id}`}
                                    title="Click to update row color"
                                >
                                    {rowColor === 'green' && <CheckCircle size={11} />}
                                    {rowColor === 'red' && <X size={11} />}
                                    {!rowColor && (() => {
                                      if (isPending) return <Clock size={11} />;
                                      if (isProgress) return <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>;
                                      if (isDone) return <CheckCircle size={11} />;
                                      if (isCancel) return <X size={11} />;
                                      return null;
                                    })()}
                                  <span>{b.booking_status}</span>
                                </button>
                              </td>

                              {/* Created At Column */}
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="font-semibold text-slate-800">
                                  {b.created_at ? new Date(b.created_at).toLocaleDateString() : '-'}
                                </div>
                                <div className="text-xs text-slate-500 font-medium mt-0.5">
                                  {b.created_at ? new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                </div>
                              </td>

                              {/* Patient Contact */}
                              <td className="px-5 py-4 min-w-[150px]">
                                <div className="font-semibold text-slate-900">{b.patient_name}</div>
                                <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                  <Phone size={12} className="text-slate-400" />
                                  <span>{b.contact_number}</span>
                                </div>
                              </td>

                              {/* Service Info */}
                              <td className="px-5 py-4 min-w-[150px]">
                                <div className="font-semibold text-slate-800">{b.service_name}</div>
                                <div className="text-xs text-slate-400 font-medium mt-0.5">
                                  {b.booking_date} • {b.booking_time}
                                </div>
                              </td>

                              {/* Address */}
                              <td className="px-5 py-4 min-w-[200px] max-w-xs">
                                <p className="truncate text-slate-600 font-medium" title={b.address}>
                                  {b.address}
                                </p>
                              </td>

                              {/* Amount Price */}
                              <td className="px-5 py-4 text-right font-black text-slate-900 whitespace-nowrap">
                                {(typeof b.amount === 'number' && !isNaN(b.amount) ? b.amount : 0).toFixed(2)} EGP
                              </td>

                              {/* Payment status */}
                              <td className="px-5 py-4 whitespace-nowrap">
                                <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                                  ${b.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : ''}
                                  ${b.payment_status === 'Unpaid' ? 'bg-amber-100 text-amber-800' : ''}
                                  ${b.payment_status === 'Refunded' ? 'bg-slate-200 text-slate-700' : ''}
                                `}>
                                  {b.payment_status || 'Unpaid'}
                                </span>
                              </td>

                              {/* Notes */}
                              <td className="px-5 py-4 min-w-[150px] max-w-xs">
                                <p className="truncate text-slate-600 font-medium" title={b.notes}>
                                  {b.notes || '-'}
                                </p>
                              </td>

                              {/* Action buttons */}
                              <td className="px-5 py-4 whitespace-nowrap text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => setActiveViewBooking(b)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                    title="View Notes & Full Info"
                                    id={`view_booking_btn_${b.id}`}
                                  >
                                    <ExternalLink size={16} />
                                  </button>

                                  <button
                                    onClick={() => setActiveEditBooking(b)}
                                    className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                                    title="Edit Booking Status Details"
                                    id={`edit_booking_btn_${b.id}`}
                                  >
                                    <Edit2 size={16} />
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete the booking for ${b.patient_name}?`)) {
                                        deleteBookingItem(b.id);
                                      }
                                    }}
                                    className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                    title="Delete Booking Record"
                                    id={`delete_booking_btn_${b.id}`}
                                  >
                                    <Trash2 size={16} />
                                  </button>

                                </div>
                              </td>

                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* PAGINATION PANEL FOOTER */}
                  {processedBookings.length > 0 && (
                    <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-500" id="bookings_pagination_bar">
                      <p id="pagination_results_label">
                        Showing <span className="text-slate-800">{(bookingCurrentPage - 1) * bookingsPerPage + 1}</span> to{' '}
                        <span className="text-slate-800">
                          {Math.min(bookingCurrentPage * bookingsPerPage, processedBookings.length)}
                        </span>{' '}
                        of <span className="text-slate-800">{processedBookings.length}</span> results
                      </p>

                      <div className="flex flex-wrap items-center justify-center gap-1.5" id="pagination_buttons_wrapper">
                        <button
                          onClick={() => setBookingCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={bookingCurrentPage === 1}
                          className="p-1.5 border border-slate-200 rounded bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                          id="pagination_prev_btn"
                          aria-label="Previous Page"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        
                        {Array.from({ length: totalBookingPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setBookingCurrentPage(pageNum)}
                            className={`px-3 py-1.5 rounded border text-xs font-bold transition
                              ${bookingCurrentPage === pageNum
                                ? 'bg-slate-900 border-slate-900 text-white'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                              }
                            `}
                            id={`pagination_page_btn_${pageNum}`}
                          >
                            {pageNum}
                          </button>
                        ))}

                        <button
                          onClick={() => setBookingCurrentPage((p) => Math.min(totalBookingPages, p + 1))}
                          disabled={bookingCurrentPage === totalBookingPages}
                          className="p-1.5 border border-slate-200 rounded bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                          id="pagination_next_btn"
                          aria-label="Next Page"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* 2. SERVICES TAB */}
            {activeTab === 'services' && (
              <div className="space-y-6" id="services_tab_view">
                
                {/* Header widget */}
                <div className="flex justify-between items-center" id="services_panel_header">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Available Clinic & Treatment Classes</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Admin can manage therapeutic classes, service descriptions, and pricing models.</p>
                  </div>
                  <button
                    onClick={() => setIsAddServiceOpen(true)}
                    className="flex items-center gap-1.5 px-4.5 py-2 text-sm font-bold bg-teal-400 hover:bg-teal-300 text-slate-900 rounded-lg transition shadow-xs"
                    id="add_service_launcher_btn"
                  >
                    <Plus size={16} className="stroke-[2.5]" />
                    <span>Add Service</span>
                  </button>
                </div>

                {/* SERVICE CARDS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="services_deck_grid">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition relative group"
                      id={`service_card_${service.id}`}
                    >
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          {/* Category Badge */}
                          <span className="self-start px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-teal-50 text-teal-800 tracking-wider mt-1">
                            {service.category}
                          </span>

                          {/* Image as medium icon */}
                          {service.image_url ? (
                            <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 shadow-sm border border-slate-200">
                              <img 
                                src={service.image_url} 
                                alt={service.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  // Fallback if the image URL is broken
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=600&auto=format&fit=crop';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100">
                              <Briefcase size={20} className="text-teal-600" />
                            </div>
                          )}
                        </div>

                          {/* Title */}
                          <h4 className="text-base font-bold text-slate-950 group-hover:text-teal-900 transition-colors">
                            {service.name}
                          </h4>
                          
                          {/* Subtitle mapped from 'description' */}
                          <p className="text-sm text-slate-500 font-medium leading-relaxed mt-1.5 line-clamp-2" title={service.description}>
                            {service.description || 'No description provided.'}
                          </p>
                      </div>

                        {/* Footer containing Price & flow triggers */}
                        <div className="border-t border-slate-100/80 pt-4 mt-5 flex items-center justify-between" id={`service_card_footer_${service.id}`}>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Session Rate</p>
                          <p className="text-lg font-extrabold text-slate-900">${(typeof service.price === 'number' && !isNaN(service.price) ? service.price : 0).toFixed(2)}</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setActiveEditService(service)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition"
                            title="Edit Service Details"
                            id={`edit_services_btn_${service.id}`}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setActiveDeleteService(service)}
                            className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-700 rounded-lg transition"
                            title="Delete Service"
                            id={`delete_services_btn_${service.id}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                  </div>
                  ))}
                </div>

              </div>
            )}

            {/* 3. SYSTEM NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-8" id="notifications_tab_view">
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="notifications_split_views">
                  
                  {/* LEFT: BROADCAST FORM (Occupies 1 unit) */}
                  <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-xs p-6" id="notification_composer_card">
                    <div className="flex items-center gap-2.5 mb-6" id="form_header_title">
                      <div className="bg-indigo-50 p-2 rounded-lg text-indigo-700">
                        <Bell size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Broadcast Portal</h3>
                        <p className="text-xs text-slate-500">Send an alert or message immediately.</p>
                      </div>
                    </div>

                    {/* Feedback states */}
                    {notificationFeedback && (
                      <div
                        className={`p-3.5 mb-5 rounded-lg text-xs font-semibold flex items-start gap-2.5 border
                          ${notificationFeedback.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                          }
                        `}
                        id="feedback_box"
                      >
                        {notificationFeedback.type === 'success' ? (
                          <CheckCircle size={16} className="shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        )}
                        <p>{notificationFeedback.text}</p>
                      </div>
                    )}

                    <form onSubmit={handleSendNotification} className="space-y-4" id="broadcast_form_element">
                      
                      {/* Recipient Dropdown */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                          Select Recipient User / Patient *
                        </label>
                        <div className="relative">
                          <select
                            id="select_recipient_dropdown"
                            value={notificationTargetUser}
                            onChange={(e) => setNotificationTargetUser(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white appearance-none transition"
                            required
                          >
                            <option value="">-- Choose User --</option>
                            {usersList.map((user) => (
                              <option key={user} value={user}>
                                {user}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Select target patient in standard registry to direct notification.</p>
                      </div>

                      {/* Notification Title */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                          Notification Title *
                        </label>
                        <input
                          id="notification_title_input"
                          type="text"
                          placeholder="e.g. Health Checkup Delayed"
                          value={notificationTitle}
                          onChange={(e) => setNotificationTitle(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                          required
                        />
                      </div>

                      {/* Notification Message */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                          Notification Message *
                        </label>
                        <textarea
                          id="notification_message_textarea"
                          rows={4}
                          placeholder="Write the full broadcast instruction..."
                          value={notificationMessage}
                          onChange={(e) => setNotificationMessage(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none transition"
                          required
                        ></textarea>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-bold bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition"
                        id="submit_notification_btn"
                      >
                        <Send size={15} />
                        <span>Send Notification</span>
                      </button>

                    </form>

                  </div>

                  {/* RIGHT: BROADCAST LOG (Occupies 2 units) */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-xs p-6 flex flex-col" id="notifications_logs_card">
                    <div className="flex items-center justify-between mb-5" id="logs_header">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Broadcast History Log</h3>
                        <p className="text-xs text-slate-500 font-medium">Review sent messages and user transaction timings.</p>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold">
                        {notifications.length} Logs Total
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-100/80 pr-1" id="notifications_list_box">
                      {notifications.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                          <Bell size={36} className="text-slate-200 mb-2" />
                          <p className="text-sm font-bold">No notifications sent yet</p>
                          <p className="text-xs text-slate-500 mt-1">Direct alerts above to list them here.</p>
                        </div>
                      ) : (
                        notifications.map((log) => (
                          <div key={log.id} className="py-4.5 first:pt-0 last:pb-0" id={`notification_log_item_${log.id}`}>
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                                  {log.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
                                  <span className="flex items-center gap-1 bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                    <User size={11} />
                                    <span>To: {log.user_id}</span>
                                  </span>
                                  <span>•</span>
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <Clock size={10} />
                                    {log.sent_at}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100/60 font-medium">
                                  {log.message}
                                </p>
                              </div>

                              <button
                                onClick={() => {
                                  if (confirm('Delete this notification log entry?')) {
                                    setNotifications((prev) => prev.filter((n) => n.id !== log.id));
                                  }
                                }}
                                className="p-1 text-slate-300 hover:text-red-600 hover:bg-slate-50 rounded transition"
                                title="Delete Log Record"
                                id={`delete_log_btn_${log.id}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                  </div>

                </div>

              </div>
            )}

          </div>

        </main>

      </div>

      {/* --- MODAL POPUPS --- */}

      {/* GLOBAL DATALIST FOR DYNAMIC STATUS AUTOCOMPLETE */}
      <datalist id="booking_statuses_list">
        {uniqueStatuses.map(s => <option key={s} value={s} />)}
      </datalist>

      {/* A. VIEW BOOKING DETAILS MODAL CONTAINER */}
      {activeViewBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-opacity duration-200" id="view_booking_modal_overlay">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150" id="view_booking_modal_content">
            
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] bg-teal-500 text-slate-950 px-2 py-0.5 rounded font-black tracking-wide uppercase">
                  Booking Receipt
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-1">ID: {activeViewBooking.id}</h3>
              </div>
              <button
                onClick={() => setActiveViewBooking(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                id="close_view_booking_modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Details List */}
            <div className="p-6 space-y-4 text-sm" id="view_booking_attributes">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Patient Name</h4>
                  <p className="font-semibold text-slate-900 mt-0.5">{activeViewBooking.patient_name}</p>
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact Number</h4>
                  <p className="font-semibold text-slate-900 mt-0.5">{activeViewBooking.contact_number}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Service Name</h4>
                  <p className="font-semibold text-teal-800 mt-0.5">{activeViewBooking.service_name}</p>
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Amount Cost</h4>
                  <p className="font-black text-slate-950 mt-0.5">${(typeof activeViewBooking.amount === 'number' && !isNaN(activeViewBooking.amount) ? activeViewBooking.amount : 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Appointment Date</h4>
                  <p className="font-semibold text-slate-900 mt-0.5">{activeViewBooking.booking_date}</p>
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Appointment Time</h4>
                  <p className="font-semibold text-slate-900 mt-0.5">{activeViewBooking.booking_time}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Patient Address</h4>
                <div className="flex gap-1.5 mt-1 items-start text-slate-700">
                  <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <p className="font-medium">{activeViewBooking.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Booking Status</h4>
                  <span className="inline-block px-2.5 py-0.5 mt-1 rounded text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                    {activeViewBooking.booking_status}
                  </span>
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email</h4>
                  <p className="font-semibold text-slate-900 mt-1">{activeViewBooking.email || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Medical Notes / Admin Directives</h4>
                <p className="bg-slate-50 border border-slate-100 text-slate-600 rounded-lg p-3 text-xs leading-relaxed mt-1 whitespace-pre-line font-medium">
                  {activeViewBooking.notes || 'No standard directives logged.'}
                </p>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end gap-2.5" id="view_booking_footer_actions">
              <button
                onClick={() => {
                  setActiveEditBooking(activeViewBooking);
                  setActiveViewBooking(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
                id="view_to_edit_booking_launcher"
              >
                Modify Status
              </button>
              <button
                onClick={() => setActiveViewBooking(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
                id="close_view_button"
              >
                Dismiss
              </button>
            </div>

          </div>
        </div>
      )}

      {/* B. EDIT BOOKING MODAL */}
      {activeEditBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-opacity duration-200" id="edit_booking_modal_overlay">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150" id="edit_booking_modal_content">
            
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Update Booking Request</h3>
                <p className="text-[10px] text-slate-400">Record ID: {activeEditBooking.id}</p>
              </div>
              <button
                onClick={() => setActiveEditBooking(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                id="close_edit_booking_modal"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateBookingDetails(activeEditBooking);
              }}
              className="p-6 space-y-4"
              id="edit_booking_form"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Patient Name</label>
                  <input
                    type="text"
                    value={activeEditBooking.patient_name}
                    onChange={(e) => setActiveEditBooking({ ...activeEditBooking, patient_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Contact Number</label>
                  <input
                    type="text"
                    value={activeEditBooking.contact_number}
                    onChange={(e) => setActiveEditBooking({ ...activeEditBooking, contact_number: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Servicing Procedure</label>
                  <select
                    value={activeEditBooking.service_name}
                    onChange={(e) => {
                      const sel = e.target.value;
                      const matched = services.find(s => s.name === sel);
                      setActiveEditBooking({
                        ...activeEditBooking,
                        service_name: sel,
                        amount: matched ? Number(matched.price) : activeEditBooking.amount
                      });
                    }}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    required
                  >
                    <option value="" disabled>Select a service</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Charge Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={activeEditBooking.amount}
                    onChange={(e) => setActiveEditBooking({ ...activeEditBooking, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Scheduled Date</label>
                  <input
                    type="date"
                    value={activeEditBooking.booking_date}
                    onChange={(e) => setActiveEditBooking({ ...activeEditBooking, booking_date: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Scheduled Time</label>
                  <input
                    type="text"
                    value={activeEditBooking.booking_time}
                    placeholder="e.g. 11:30 AM"
                    onChange={(e) => setActiveEditBooking({ ...activeEditBooking, booking_time: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Street Address</label>
                <input
                  type="text"
                  value={activeEditBooking.address}
                  onChange={(e) => setActiveEditBooking({ ...activeEditBooking, address: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Booking Status</label>
                  <input
                    type="text"
                    list="booking_statuses_list"
                    value={activeEditBooking.booking_status}
                    onChange={(e) => setActiveEditBooking({ ...activeEditBooking, booking_status: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Payment Status</label>
                  <select
                    id="edit_booking_payment_select"
                    value={activeEditBooking.payment_status}
                    onChange={(e) => setActiveEditBooking({ ...activeEditBooking, payment_status: e.target.value as PaymentStatus })}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-semibold"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Medical Notes & Comments</label>
                <textarea
                  rows={2}
                  value={activeEditBooking.notes}
                  onChange={(e) => setActiveEditBooking({ ...activeEditBooking, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none"
                ></textarea>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveEditBooking(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
                  id="submit_edit_booking_btn"
                >
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* C. ADD MANUAL BOOKING MODAL */}
      {isAddBookingOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-opacity duration-200" id="add_booking_modal_overlay">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150" id="add_booking_modal_content">
            
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Log A New Booking</h3>
                <p className="text-[10px] text-teal-400 font-bold">Admin Procedure Entry</p>
              </div>
              <button
                onClick={() => setIsAddBookingOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                id="close_add_booking_modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBookingSubmit} className="p-6 space-y-4 text-sm" id="new_booking_form">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Patient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bob Vance"
                    value={bookingForm.patient_name}
                    onChange={(e) => setBookingForm({ ...bookingForm, patient_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Contact Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +1 (555) 777-1111"
                    value={bookingForm.contact_number}
                    onChange={(e) => setBookingForm({ ...bookingForm, contact_number: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Clinic Procedure *</label>
                  <select
                    value={bookingForm.service_name}
                    onChange={(e) => {
                      const sel = e.target.value;
                      const matched = services.find(s => s.name === sel);
                      setBookingForm({
                        ...bookingForm,
                        service_name: sel,
                        amount: matched ? String(matched.price) : bookingForm.amount
                      });
                    }}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                    required
                  >
                    <option value="" disabled>Select a service</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Price Override ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Leave blank for standard rate"
                    value={bookingForm.amount}
                    onChange={(e) => setBookingForm({ ...bookingForm, amount: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Date</label>
                  <input
                    type="date"
                    value={bookingForm.booking_date}
                    onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white animate-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Time Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. 03:00 PM"
                    value={bookingForm.booking_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, booking_time: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Delivery Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street address for therapist visit"
                  value={bookingForm.address}
                  onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Initial Status</label>
                  <input
                    type="text"
                    list="booking_statuses_list"
                    value={bookingForm.booking_status}
                    onChange={(e) => setBookingForm({ ...bookingForm, booking_status: e.target.value })}
                    placeholder="e.g. Pending"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Initial Payment</label>
                  <select
                    value={bookingForm.payment_status}
                    onChange={(e) => setBookingForm({ ...bookingForm, payment_status: e.target.value as PaymentStatus })}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-semibold"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Diagnosis / Visit Directives</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Patient requires wheelchair entry helper. Follow-up."
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBookingOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
                  id="submit_add_booking_btn"
                >
                  Register Booking
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* D. ADD SERVICE MODAL */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-opacity duration-200" id="add_service_modal_overlay">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150" id="add_service_modal_content">
            
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Add New Clinic Service</h3>
                <p className="text-[10px] text-slate-400">Configure medical treatment offering</p>
              </div>
              <button
                onClick={() => setIsAddServiceOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                id="close_add_service_modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddServiceSubmit} className="p-6 space-y-4" id="add_service_form">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Service Name *</label>
                <input
                  id="add_service_name_field"
                  type="text"
                  required
                  placeholder="e.g. Cardiological Screening"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Image URL</label>
                <input
                  id="add_service_image_field"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={serviceForm.image_url}
                  onChange={(e) => setServiceForm({ ...serviceForm, image_url: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category Dropdown</label>
                <div className="relative">
                  <select
                    id="add_service_category_dropdown"
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white appearance-none transition"
                  >
                    {SUGGESTED_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
                <textarea
                  id="add_service_description_field"
                  rows={3}
                  placeholder="Provide comprehensive details about the session criteria, scope, and target patients..."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Price field ($ USD)</label>
                <input
                  id="add_service_price_field"
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 125.00"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100" id="add_service_buttons_container">
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition font-semibold"
                  id="cancel_add_service_btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition font-semibold"
                  id="submit_add_service_btn"
                >
                  Add Service
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* E. EDIT SERVICE MODAL */}
      {activeEditService && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-opacity duration-200" id="edit_service_modal_overlay">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150" id="edit_service_modal_content">
            
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 font-semibold text-slate-100">Edit Service Details</h3>
                <p className="text-[10px] text-slate-400">ID: {activeEditService.id}</p>
              </div>
              <button
                onClick={() => setActiveEditService(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                id="close_edit_service_modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditServiceSubmit} className="p-6 space-y-4" id="edit_service_form">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Service Name *</label>
                <input
                  id="edit_service_name_field"
                  type="text"
                  required
                  value={activeEditService.name}
                  onChange={(e) => setActiveEditService({ ...activeEditService, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Image URL</label>
                <input
                  id="edit_service_image_field"
                  type="url"
                  value={activeEditService.image_url || ''}
                  onChange={(e) => setActiveEditService({ ...activeEditService, image_url: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category Dropdown</label>
                <div className="relative">
                  <select
                    id="edit_service_category_dropdown"
                    value={activeEditService.category}
                    onChange={(e) => setActiveEditService({ ...activeEditService, category: e.target.value })}
                    className="w-full pl-3 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-medium appearance-none transition"
                  >
                    {SUGGESTED_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
                <textarea
                  id="edit_service_description_field"
                  rows={3}
                  value={activeEditService.description}
                  onChange={(e) => setActiveEditService({ ...activeEditService, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none font-medium"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Price field ($)</label>
                <input
                  id="edit_service_price_field"
                  type="number"
                  step="0.01"
                  required
                  value={activeEditService.price}
                  onChange={(e) => setActiveEditService({ ...activeEditService, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-black"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100" id="edit_service_buttons_container">
                <button
                  type="button"
                  onClick={() => setActiveEditService(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition font-semibold"
                  id="cancel_edit_service_btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition font-semibold"
                  id="submit_edit_service_btn"
                >
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* F. DELETE SERVICE FLOW: CONFIRMATION MODAL */}
      {activeDeleteService && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-opacity duration-200" id="delete_service_modal_overlay">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150" id="delete_service_modal_content">
            
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950">Remove Clinic Service?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you absolutely sure you want to delete <span className="font-semibold text-slate-700">"{activeDeleteService.name}"</span>?
                </p>
                <p className="text-[10px] text-red-500 font-semibold bg-red-50 p-2 rounded border border-red-100 mt-2.5">
                  Warning: This action will permanently remove this service from your administrative catalog.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-100/80 px-6 py-4 flex gap-2 justify-end" id="delete_service_buttons_container">
              <button
                onClick={() => setActiveDeleteService(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
                id="cancel_delete_service_btn"
              >
                No, Keep It
              </button>
              <button
                onClick={handleDeleteServiceConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition shadow-xs font-bold"
                id="confirm_delete_service_btn"
              >
                Yes, Delete Service
              </button>
            </div>

          </div>
        </div>
      )}

      {/* G. QUICK STATUS EDIT MODAL */}
      {activeStatusEditBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-opacity duration-200" id="quick_status_modal_overlay">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150" id="quick_status_modal_content">
            
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100">Update Row Highlight</h3>
                <p className="text-[10px] text-slate-400">Record ID: {activeStatusEditBooking.id}</p>
              </div>
              <button
                onClick={() => setActiveStatusEditBooking(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <button
                onClick={() => handleQuickStatusUpdate('green')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold bg-green-100 text-green-800 hover:bg-green-200 rounded-lg transition border border-green-200"
              >
                Contacted
              </button>
              <button
                onClick={() => handleQuickStatusUpdate('red')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold bg-red-100 text-red-800 hover:bg-red-200 rounded-lg transition border border-red-200"
              >
                Cancelled
              </button>
              <button
                onClick={() => handleQuickStatusUpdate(null)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-lg transition border border-slate-200"
              >
                Clear Highlight
              </button>
            </div>

            <div className="bg-slate-50 border-t border-slate-100/80 px-6 py-4 flex justify-end">
              <button
                onClick={() => setActiveStatusEditBooking(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
