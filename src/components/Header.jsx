import { NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
      <div className="container">
        <NavLink className="navbar-brand d-flex align-items-center" to="/">
          <img
            src="https://brand.psu.edu/images/shared-images/PSU-mark-navy.jpg"
            alt="Penn State Logo"
            height="40"
            className="me-2 rounded"
          />
          Club Portal
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/members">Members</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/storefront">Storefront</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/finalization">Finalization</NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

