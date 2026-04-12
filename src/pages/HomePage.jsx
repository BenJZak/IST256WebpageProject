import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <header className="hero-section text-white d-flex align-items-center">
      <div className="container text-center py-5">
        <h1 className="mb-3">Welcome to the Student Club Portal</h1>
        <p className="lead mb-4">Organize club resources in one place.</p>

        <Link to="/storefront" className="btn btn-light btn-lg me-2">
          Open Storefront
        </Link>
        <Link to="/members" className="btn btn-outline-light btn-lg me-2">
          Manage Members
        </Link>
        <Link to="/finalization" className="btn btn-warning btn-lg">
          Finalization Page
        </Link>
        <div className="mt-3">
          <Link to="/orders" className="btn btn-primary btn-lg me-2">
            Order History
          </Link>
          <Link to="/approval" className="btn btn-outline-light btn-lg">
            Approval Page
          </Link>
        </div>
      </div>
    </header>
  );
}
