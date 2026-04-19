const quickActions = [
  {
    title: 'Store',
    text: 'Search available products and send selections into the cart.',
    action: 'Open Store',
    href: '#store'
  },
  {
    title: 'Checkout',
    text: 'Confirm contact details, choose payment, and send the order for approval.',
    action: 'Go to Checkout',
    href: '#checkout'
  },
  {
    title: 'My Orders',
    text: 'Look up your submitted orders with your registered checkout email.',
    action: 'View My Orders',
    href: '#orders'
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
  }
];

export default function HomePage() {
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
            <a href="#checkout" className="btn btn-warning btn-lg">
              Go to Checkout
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
                <span className="status-kicker">Order Review</span>
                <strong>New checkout submissions are sent to admin review before they are marked approved or declined.</strong>
              </div>
              <a href="#admin-review" className="btn btn-outline-dark">
                Open Admin Review
              </a>
            </div>

            <div className="row g-3">
              {adminActions.map(renderAdminAction)}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
