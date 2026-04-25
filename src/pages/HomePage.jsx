const quickActions = [
  {
    title: 'Store',
    text: 'Search product details and send selections into the shopping cart.',
    action: 'Open Store',
    href: '#store'
  },
  {
    title: 'Orders',
    text: 'Look up submitted orders and start returns from one place.',
    action: 'View Orders',
    href: '#orders'
  },
  {
    title: 'Login',
    text: 'Sign in to check your orders or manage the storefront as staff.',
    action: 'Login',
    href: '#login'
  }
];

const adminActions = [
  {
    title: 'Pending Approvals',
    text: 'Review new checkout submissions and approve or decline each order.',
    action: 'Open Admin Review',
    href: '#admin-review'
  },
  {
    title: 'Order History',
    text: 'Check every submitted order and see the latest approval status.',
    action: 'View Admin Orders',
    href: '#admin-history'
  },
  {
    title: 'Member Registration',
    text: 'Register members and keep contact information organized.',
    action: 'Manage Members',
    href: '#admin-members'
  },
  {
    title: 'Product Management',
    text: 'Add products to the store or remove items that are no longer available.',
    action: 'Manage Products',
    href: '#admin-products'
  },
  {
    title: 'Returns Queue',
    text: 'Review return requests and mark each request approved, declined, or resolved.',
    action: 'Review Returns',
    href: '#admin-returns'
  }
];

export default function HomePage(props) {
  const isAdmin = props.authUser && props.authUser.role === 'admin';
  let statusKicker = 'Staff Access';
  let statusText = 'Staff can sign in to review orders, manage products, and handle returns.';
  let adminButtonHref = '#login';
  let adminButtonText = 'Admin Login';

  if (isAdmin) {
    statusKicker = 'Order Review';
    statusText = 'New checkout submissions are sent to admin review before they are marked approved or declined.';
    adminButtonHref = '#admin-review';
    adminButtonText = 'Open Admin Review';
  }

  function renderQuickAction(item) {
    return (
      <div className="col-md-4" key={item.title}>
        <div className="home-action-card h-100">
          <h3>{item.title}</h3>
          <p>{item.text}</p>
          <a href={item.href} className="btn btn-primary">
            {item.action}
          </a>
        </div>
      </div>
    );
  }

  function renderAdminAction(item) {
    return (
      <div className="col-md-6 col-xl-3" key={item.title}>
        <div className="admin-action-card h-100">
          <h3>{item.title}</h3>
          <p>{item.text}</p>
          <a href={item.href} className="btn btn-outline-dark">
            {item.action}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <header className="hero-section text-white">
        <div className="container hero-content">
          <h1 className="mb-3">Student Club Portal</h1>
          <p className="lead mb-4">
            Keep members, store orders, and approvals moving from one clean workspace.
          </p>

          <div className="d-flex flex-wrap gap-2">
            <a href="#store" className="btn btn-light btn-lg">
              Open Store
            </a>
            <a href="#orders" className="btn btn-warning btn-lg">
              View Orders
            </a>
          </div>
        </div>
      </header>

      <section className="home-workspace">
        <div className="container">
          <div className="row g-3">
            {quickActions.map(renderQuickAction)}
          </div>

          <section className="admin-section" aria-labelledby="admin-heading">
            <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-3">
              <div>
                <h2 id="admin-heading" className="mb-1">Admin</h2>
                <p className="text-muted mb-0">Review orders and keep the queue moving.</p>
              </div>
            </div>

            <div className="home-status-strip mb-3">
              <div>
                <span className="status-kicker">{statusKicker}</span>
                <strong>
                  {statusText}
                </strong>
              </div>
              <a href={adminButtonHref} className="btn btn-outline-dark">
                {adminButtonText}
              </a>
            </div>

            {isAdmin && (
              <div className="row g-3">
                {adminActions.map(renderAdminAction)}
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
