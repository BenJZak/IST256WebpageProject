function getNavClass(currentPage, pageName) {
  if (currentPage === pageName) {
    return 'nav-link active';
  }

  return 'nav-link';
}

export default function Header(props) {
  return (
    <nav className="navbar navbar-expand-lg navbar-light site-navbar sticky-top">
      <div className="container">
        <a className="navbar-brand d-flex align-items-center gap-2" href="#home">
          <img
            src="https://brand.psu.edu/images/shared-images/PSU-mark-navy.jpg"
            alt="Penn State Logo"
            height="40"
            className="brand-mark"
          />
          <span className="brand-text">Club Portal</span>
        </a>

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
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item">
              <a className={getNavClass(props.currentPage, 'home')} href="#home">Home</a>
            </li>
            <li className="nav-item">
              <a className={getNavClass(props.currentPage, 'store')} href="#store">Store</a>
            </li>
            <li className="nav-item">
              <a className={getNavClass(props.currentPage, 'orders')} href="#orders">My Orders</a>
            </li>
            <li className="nav-item">
              <a className={getNavClass(props.currentPage, 'admin')} href="#admin">Admin</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
