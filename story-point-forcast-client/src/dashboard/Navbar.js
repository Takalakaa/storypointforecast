import { Link, useMatch, useResolvedPath } from "react-router-dom";
import { Col, Navbar } from "reactstrap";

export default function MainNavbar({ onLogout }) {  // Accept onLogout as a prop
  return (
    <Col md = {{size: 12}}>
      <Navbar className="nav">
        <Link to="/" className="site-title">
          Story Point Forcaster
        </Link>
        <ul>
          <CustomLink to="/project">Project</CustomLink>
          <CustomLink to="/compare">Compare</CustomLink>
          <CustomLink to="/skills">Skills</CustomLink>
          <CustomLink to="/profile">Profile</CustomLink>
          <Link to="/login" onClick={onLogout}>Logout</Link>
        </ul>
      </Navbar>
    </Col>
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
