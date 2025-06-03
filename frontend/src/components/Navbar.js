import { Link } from 'react-router-dom';

function Navbar({ token, onLogout }) {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white">Learning Assistant</Link>
        <div className="space-x-4">
          {token ? (
            <>
              <Link to="/dashboard" className="text-white hover:text-pink-500">Dashboard</Link>
              <button onClick={onLogout} className="text-white hover:text-pink-500">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white hover:text-pink-500">Login</Link>
              <Link to="/register" className="text-white hover:text-pink-500">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;