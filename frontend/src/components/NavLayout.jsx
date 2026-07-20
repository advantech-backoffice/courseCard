import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { 
 BookOpen, 
 LogOut, 
 Users,
 Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
 return twMerge(clsx(inputs));
}

export default function NavLayout({ role }) {
 const { user, logout } = useAuth();
 const location = useLocation();
 const navigate = useNavigate();

 const handleLogout = () => {
 logout();
 navigate(`/${role}/login`);
 };

 return (
 <div className="min-h-screen bg-transparent text-zinc-900 transition-colors duration-300">
 <nav className="h-16 bg-white/70 backdrop-blur-xl border-b border-zinc-200/60 sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between">
 <div className="flex items-center space-x-8">
 <Link to={`/${role}/dashboard`} className="flex items-center">
 <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
 <BookOpen className="w-5 h-5 text-white" />
 </div>
 <span className="ml-3 font-bold text-xl tracking-tight hidden sm:block">Advantech</span>
 </Link>

  <div className="hidden md:flex items-center space-x-1">
  <Link
  to={`/${role}/dashboard`}
  className={cn(
  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
  location.pathname.includes('dashboard')
  ? "bg-blue-50 text-blue-600 "
  : "text-zinc-600 hover:bg-zinc-100 :bg-zinc-800"
  )}
  >
  Dashboard
  </Link>
  {role === 'student' && (
  <Link
  to="/student/notices"
  className={cn(
  "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
  location.pathname.includes('notices')
  ? "bg-blue-50 text-blue-600 "
  : "text-zinc-600 hover:bg-zinc-100 :bg-zinc-800"
  )}
  >
  <Bell className="w-4 h-4" />
  Notices
  </Link>
  )}
  </div>
 </div>

 <div className="flex items-center space-x-2 sm:space-x-4">
 <div className="h-8 w-px bg-zinc-200 mx-2 hidden sm:block"></div>

 <div className="flex items-center space-x-3">
 <div className="text-right hidden sm:block">
 <p className="text-sm font-medium">{user?.username}</p>
 <p className="text-xs text-zinc-500 capitalize">{user?.role}</p>
 </div>
 <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center border border-zinc-300 ">
 <Users className="w-5 h-5 text-zinc-600 " />
 </div>
 <button
 onClick={handleLogout}
 className="p-2 text-red-600 hover:bg-red-50 :bg-red-900/10 rounded-lg transition-all"
 title="Logout"
 >
 <LogOut className="w-5 h-5" />
 </button>
 </div>
 </div>
 </nav>

 <main className="p-4 sm:p-8 max-w-7xl mx-auto">
 <Outlet />
 </main>
 </div>
 );
}
