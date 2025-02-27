import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar, NavbarBrand, Nav, NavItem, NavLink, Container } from 'reactstrap';

export default function MainNavbar({ onLogout, accessLevel }) {
  return (
    <Navbar color="dark" dark expand="md" className="d-flex">
      <Container className="d-flex justify-content-between">
        <NavbarBrand tag={Link} to="/">
          Story Point Forcaster
        </NavbarBrand>

        <Nav className="d-flex" navbar>
          <NavItem>
            <NavLink tag={Link} to="/project">
              Project
            </NavLink>
          </NavItem>
          {accessLevel > 1 && (
            <NavItem>
              <NavLink tag={Link} to="/compare">
                Compare
              </NavLink>
            </NavItem>
          )}
          <NavItem>
            <NavLink tag={Link} to="/skills">
              Skills
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink tag={Link} to="/profile">
              Profile
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink tag={Link} to="/login" onClick={onLogout}>
              Logout
            </NavLink>
          </NavItem>
        </Nav>
      </Container>
    </Navbar>
  );
}
