import { Link, useLocation } from 'react-router-dom';

function AppHeader() {
  const location = useLocation();

  return (
    <nav className="app-navbar">
      <Link to="/" className="brand">⚡ PlagiarismGuard</Link>
      <ul className="nav-links">
        <li>
          <Link
            to="/"
            className={location.pathname === '/' ? 'active' : ''}
          >
            Home
          </Link>
        </li>
        <li>
          <Link
            to="/admin"
            className={location.pathname.startsWith('/admin') ? 'active' : ''}
          >
            Admin
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default AppHeader;
