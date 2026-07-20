import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
 return (
 <div className="min-h-screen flex items-center justify-center bg-zinc-50 ">
 <div className="text-center space-y-6">
 <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
 <AlertTriangle className="w-10 h-10 text-red-500" />
 </div>
 <h1 className="text-6xl font-bold text-zinc-900 ">404</h1>
 <p className="text-zinc-500 text-lg">Page not found</p>
 <Link
 to="/"
 className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
 >
 Go Home
 </Link>
 </div>
 </div>
 );
}
