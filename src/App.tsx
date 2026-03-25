import React, { useState, useEffect } from 'react';
import { 
  Hotel, 
  Bed, 
  Users, 
  Calendar, 
  Download, 
  LogOut, 
  LayoutDashboard, 
  UserCircle, 
  CreditCard,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Stats {
  hotels: number;
  rooms: number;
  bookings: number;
  guests: number;
}

interface Booking {
  id: number;
  guest_name: string;
  room_type: string;
  hotel_name: string;
  check_in: string;
  check_out: string;
  total_price: number;
}

// --- Components ---

const LoginPage = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      if (data.success) {
        if (isRegistering) {
          alert('Registration successful! Please login.');
          setIsRegistering(false);
          setPassword('');
        } else {
          onLogin(data.user);
        }
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen hotel-bg flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 rounded-3xl"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-slate-900 mb-2">Grand Horizon</h1>
          <p className="text-slate-600">{isRegistering ? 'Create Admin Account' : 'Admin Management Portal'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors shadow-lg"
          >
            {isRegistering ? 'Register Admin' : 'Login to Dashboard'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  
  const [newStaff, setNewStaff] = useState({ name: '', role: '', salary: '', hotel_id: '1' });
  const [newHotel, setNewHotel] = useState({ name: '', location: '' });
  const [newRoom, setNewRoom] = useState({ type: '', price: '', hotel_id: '1' });
  const [newGuest, setNewGuest] = useState({ name: '', phone: '', email: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, bookingsRes, hotelsRes, roomsRes, guestsRes, staffRes, paymentsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/bookings'),
        fetch('/api/hotels'),
        fetch('/api/rooms'),
        fetch('/api/guests'),
        fetch('/api/staff'),
        fetch('/api/payments')
      ]);
      setStats(await statsRes.json());
      setBookings(await bookingsRes.json());
      setHotels(await hotelsRes.json());
      setRooms(await roomsRes.json());
      setGuests(await guestsRes.json());
      setStaff(await staffRes.json());
      setPayments(await paymentsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownload = () => {
    window.location.href = '/api/download-sql';
  };

  const handleDownloadReceipt = (id: number) => {
    window.location.href = `/api/receipt/${id}`;
  };

  const handleAddEntity = async (endpoint: string, data: any, closeFn: () => void, resetFn: () => void) => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        closeFn();
        resetFn();
        fetchData();
      }
    } catch (error) {
      console.error(`Error adding to ${endpoint}:`, error);
    }
  };

  const renderContent = () => {
    if (loading && activeTab === 'dashboard') return <div className="p-8 text-center">Loading...</div>;

    switch (activeTab) {
      case 'hotels':
        return (
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Hotels</h2>
              <button 
                onClick={() => setShowHotelModal(true)}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
              >
                Add Hotel
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map(hotel => (
                <div key={hotel.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <Hotel size={24} />
                  </div>
                  <h3 className="font-bold text-lg">{hotel.name}</h3>
                  <p className="text-slate-500 text-sm">{hotel.location}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'rooms':
        return (
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Rooms</h2>
              <button 
                onClick={() => setShowRoomModal(true)}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
              >
                Add Room
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Hotel</th>
                    <th className="px-6 py-4 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rooms.map(room => (
                    <tr key={room.id}>
                      <td className="px-6 py-4 font-medium">{room.type}</td>
                      <td className="px-6 py-4 text-slate-600">{room.hotel_name}</td>
                      <td className="px-6 py-4 text-right font-bold">${room.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'guests':
        return (
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Guests</h2>
              <button 
                onClick={() => setShowGuestModal(true)}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
              >
                Add Guest
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guests.map(guest => (
                <div key={guest.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold">
                    {guest.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold">{guest.name}</h3>
                    <p className="text-slate-500 text-sm">{guest.phone}</p>
                    <p className="text-slate-400 text-xs">{guest.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'staff':
        return (
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Staff</h2>
              <button 
                onClick={() => setShowStaffModal(true)}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800"
              >
                Add Staff
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Hotel</th>
                    <th className="px-6 py-4 text-right">Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.map(s => (
                    <tr key={s.id}>
                      <td className="px-6 py-4 font-medium">{s.name}</td>
                      <td className="px-6 py-4 text-slate-600">{s.role}</td>
                      <td className="px-6 py-4 text-slate-600">{s.hotel_name}</td>
                      <td className="px-6 py-4 text-right font-bold">${s.salary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Hotels', value: stats?.hotels || 0, icon: Hotel, color: 'bg-blue-500', tab: 'hotels' },
                { label: 'Available Rooms', value: stats?.rooms || 0, icon: Bed, color: 'bg-emerald-500', tab: 'rooms' },
                { label: 'Active Bookings', value: stats?.bookings || 0, icon: Calendar, color: 'bg-amber-500', tab: 'dashboard' },
                { label: 'Total Guests', value: stats?.guests || 0, icon: Users, color: 'bg-purple-500', tab: 'guests' },
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setActiveTab(stat.tab)}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg`}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                  <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Recent Bookings Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="font-bold text-slate-900">Recent Bookings</h2>
                <button onClick={() => setActiveTab('dashboard')} className="text-blue-600 text-sm font-medium hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Guest</th>
                      <th className="px-6 py-4 font-semibold">Hotel</th>
                      <th className="px-6 py-4 font-semibold">Room Type</th>
                      <th className="px-6 py-4 font-semibold text-right">Amount</th>
                      <th className="px-6 py-4 font-semibold text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.length > 0 ? bookings.slice(0, 5).map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{booking.guest_name}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{booking.hotel_name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-md">
                            {booking.room_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          ${booking.total_price}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleDownloadReceipt(booking.id)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Download Receipt"
                          >
                            <Download size={18} />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          {loading ? 'Loading bookings...' : 'No bookings found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Entities Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                      <UserCircle size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900">Staff Management</h3>
                  </div>
                  <button onClick={() => setActiveTab('staff')} className="text-slate-400 hover:text-slate-600"><ChevronRight size={20} /></button>
                </div>
                <div className="space-y-4">
                  {staff.slice(0, 2).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                        <div className="font-medium text-slate-900">{s.name}</div>
                        <div className="text-xs text-slate-500">{s.role} • {s.hotel_name}</div>
                      </div>
                      <div className="text-sm font-bold text-slate-900">${s.salary}</div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setShowStaffModal(true)}
                    className="w-full flex items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm hover:border-slate-300 hover:text-slate-600 transition-all"
                  >
                    + Add New Staff Member
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                      <CreditCard size={20} />
                    </div>
                    <h3 className="font-bold text-slate-900">Recent Payments</h3>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600"><ChevronRight size={20} /></button>
                </div>
                <div className="space-y-4">
                  {payments.slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <CreditCard size={14} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{p.guest_name}</div>
                          <div className="text-xs text-slate-500">{p.method} • {new Date(p.payment_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-emerald-600">+${p.amount}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="font-display text-xl font-bold">Grand Horizon</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'hotels', label: 'Hotels', icon: Hotel },
            { id: 'rooms', label: 'Rooms', icon: Bed },
            { id: 'guests', label: 'Guests', icon: Users },
            { id: 'staff', label: 'Staff', icon: UserCircle },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-600"><Menu size={24} /></button>
            <h1 className="text-xl font-bold text-slate-900 capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              <Download size={18} />
              <span>Export SQL</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium">{user?.username}</span>
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold uppercase">
                {user?.username?.substring(0, 2)}
              </div>
            </div>
          </div>
        </header>

        {renderContent()}
      </main>

      {/* Staff Modal */}
      <AnimatePresence>
        {showStaffModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Add New Staff</h2>
                <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddEntity('/api/staff', { ...newStaff, salary: parseFloat(newStaff.salary) }, () => setShowStaffModal(false), () => setNewStaff({ name: '', role: '', salary: '', hotel_id: '1' }));
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <input 
                    type="text" 
                    required
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Salary</label>
                  <input 
                    type="number" 
                    required
                    value={newStaff.salary}
                    onChange={(e) => setNewStaff({...newStaff, salary: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hotel</label>
                  <select 
                    value={newStaff.hotel_id}
                    onChange={(e) => setNewStaff({...newStaff, hotel_id: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors mt-4"
                >
                  Save Staff Member
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hotel Modal */}
      <AnimatePresence>
        {showHotelModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Add New Hotel</h2>
                <button onClick={() => setShowHotelModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddEntity('/api/hotels', newHotel, () => setShowHotelModal(false), () => setNewHotel({ name: '', location: '' }));
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hotel Name</label>
                  <input 
                    type="text" 
                    required
                    value={newHotel.name}
                    onChange={(e) => setNewHotel({...newHotel, name: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input 
                    type="text" 
                    required
                    value={newHotel.location}
                    onChange={(e) => setNewHotel({...newHotel, location: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors mt-4"
                >
                  Save Hotel
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Room Modal */}
      <AnimatePresence>
        {showRoomModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Add New Room</h2>
                <button onClick={() => setShowRoomModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddEntity('/api/rooms', { ...newRoom, price: parseFloat(newRoom.price) }, () => setShowRoomModal(false), () => setNewRoom({ type: '', price: '', hotel_id: '1' }));
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Room Type</label>
                  <input 
                    type="text" 
                    required
                    value={newRoom.type}
                    onChange={(e) => setNewRoom({...newRoom, type: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price per Night</label>
                  <input 
                    type="number" 
                    required
                    value={newRoom.price}
                    onChange={(e) => setNewRoom({...newRoom, price: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hotel</label>
                  <select 
                    value={newRoom.hotel_id}
                    onChange={(e) => setNewRoom({...newRoom, hotel_id: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors mt-4"
                >
                  Save Room
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Guest Modal */}
      <AnimatePresence>
        {showGuestModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Add New Guest</h2>
                <button onClick={() => setShowGuestModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddEntity('/api/guests', newGuest, () => setShowGuestModal(false), () => setNewGuest({ name: '', phone: '', email: '' }));
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={newGuest.name}
                    onChange={(e) => setNewGuest({...newGuest, name: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    required
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({...newGuest, phone: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({...newGuest, email: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors mt-4"
                >
                  Save Guest
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full"
        >
          <LoginPage onLogin={(userData) => setUser(userData)} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full"
        >
          <Dashboard user={user} onLogout={() => setUser(null)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
