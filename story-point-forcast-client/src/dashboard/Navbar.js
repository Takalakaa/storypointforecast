import { Link, useMatch, useResolvedPath } from "react-router-dom";

export default function MainNavbar({ onLogout, accessLevel }) { 
  return (
    <nav className="nav">
      <Link to="/" className="site-title">
        Story Point Forcaster
      </Link>
      <ul>
        <CustomLink to="/project">Project</CustomLink>
        {accessLevel > 1 && <CustomLink to="/compare">Compare</CustomLink>}
        <CustomLink to="/skills">Skills</CustomLink>
        <CustomLink to="/profile">Profile</CustomLink>
        <Link to="/login" onClick={onLogout}>Logout</Link>
      </ul>
    </nav>
  );
}

function CustomLink({ to, children, ...props }) {
  const resolvedPath = useResolvedPath(to);
  const isActive = useMatch({ path: resolvedPath.pathname, end: true });

  return (
    <li className={isActive ? "active" : ""}>
      <Link to={to} {...props}>
        {children}
      </Link>
    </li>
  );
}
