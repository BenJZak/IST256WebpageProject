import { useState } from 'react';
import { defaultFinalization } from '../data/defaultData';
import { sendFinalizationData } from '../api/finalizationApi';
import { getStoredUser, saveUser } from '../auth/session';

function getStoredCart() {
  const savedCart = localStorage.getItem('cart');

  if (savedCart) {
    try {
      return JSON.parse(savedCart);
    } catch (error) {
      return [];
    }
  }

  return [];
}

function getCartSessionID() {
  return localStorage.getItem('cartSessionID') || '';
}

function getInitialFinalizationData() {
  const user = getStoredUser();

  if (user && user.role === 'member') {
    const startingData = Object.assign({}, defaultFinalization);
    startingData.fullName = user.name || '';
    startingData.email = user.email || '';
    startingData.phone = user.phone || '';
    startingData.billingName = user.name || '';
    return startingData;
  }

  return defaultFinalization;
}

export default function FinalizationPage() {
  const [cart, setCart] = useState(getStoredCart);
  const [formData, setFormData] = useState(getInitialFinalizationData);
  const [authUser] = useState(getStoredUser);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [checkoutErrors, setCheckoutErrors] = useState({});
  const [isSending, setIsSending] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  let cartTotal = 0;
  cart.forEach(function(item) {
    cartTotal = cartTotal + Number(item.price);
  });

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    let fieldValue = value;

    if (type === 'checkbox') {
      fieldValue = checked;
    }

    const nextFormData = Object.assign({}, formData);
    nextFormData[name] = fieldValue;
    setFormData(nextFormData);

    if (statusMessage.text) {
      setStatusMessage({ text: '', type: '' });
    }

    if (checkoutErrors[name]) {
      const nextErrors = Object.assign({}, checkoutErrors);
      delete nextErrors[name];
      setCheckoutErrors(nextErrors);
    }
  }

  function getCheckoutErrors() {
    const errors = {};

    if (formData.fullName.trim() === '') {
      errors.fullName = 'Enter your full name.';
    }

    if (formData.email.trim() === '') {
      errors.email = 'Enter your email address.';
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.email.trim())) {
        errors.email = 'Enter a valid email address.';
      }
    }

    if (formData.phone.trim() === '') {
      errors.phone = 'Enter your phone number.';
    } else {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        errors.phone = 'Enter a valid phone number with at least 10 digits.';
      }
    }

    if (formData.pickupMethod === '') {
      errors.pickupMethod = 'Choose a shipping or pickup option.';
    }

    if (formData.shippingAddress.trim() === '') {
      errors.shippingAddress = 'Enter a shipping or pickup location.';
    }

    if (formData.paymentMethod === '') {
      errors.paymentMethod = 'Choose a payment method.';
    }

    if (formData.billingName.trim() === '') {
      errors.billingName = 'Enter the billing name.';
    }

    if (formData.billingAddress.trim() === '') {
      errors.billingAddress = 'Enter the billing address.';
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'Confirm the order information before submitting.';
    }

    return errors;
  }

  function getControlClass(baseClass, fieldName) {
    if (checkoutErrors[fieldName]) {
      return baseClass + ' is-invalid';
    }

    return baseClass;
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (cart.length === 0) {
      setCheckoutErrors({});
      setStatusMessage({ text: 'Add at least one product to the cart before submitting checkout.', type: 'danger' });
      return;
    }

    const errors = getCheckoutErrors();

    if (Object.keys(errors).length > 0) {
      setCheckoutErrors(errors);
      setStatusMessage({ text: 'Please fix the highlighted checkout fields.', type: 'danger' });
      return;
    }

    setCheckoutErrors({});

    const normalizedEmail = formData.email.trim().toLowerCase();
    const jsonDocument = {
      cartSessionID: getCartSessionID(),
      status: 'pending',
      customer: {
        fullName: formData.fullName.trim(),
        email: normalizedEmail,
        phone: formData.phone.trim()
      },
      options: {
        pickupMethod: formData.pickupMethod,
        paymentMethod: formData.paymentMethod,
        shippingAddress: formData.shippingAddress.trim(),
        billingName: formData.billingName.trim(),
        billingAddress: formData.billingAddress.trim(),
        notes: formData.notes.trim()
      },
      cart,
      total: Number(cartTotal.toFixed(2))
    };

    setIsSending(true);

    sendFinalizationData(jsonDocument)
    .then(function(savedOrder) {
      localStorage.setItem('customerEmail', normalizedEmail);
      if (authUser && authUser.role === 'member' && !authUser.phone && formData.phone.trim()) {
        const nextAuthUser = Object.assign({}, authUser);
        nextAuthUser.phone = formData.phone.trim();
        saveUser(nextAuthUser);
      }
      localStorage.setItem('cart', JSON.stringify([]));
      localStorage.removeItem('cartSessionID');
      setCart([]);
      setCompletedOrder(savedOrder);
      setStatusMessage({ text: 'Checkout submitted successfully! Your email is registered for Orders, and an admin will review the order.', type: 'success' });
      setIsSending(false);
    })
    .catch(function() {
      setStatusMessage({ text: 'Error submitting checkout data.', type: 'danger' });
      setIsSending(false);
    });
  }

  function getButtonText() {
    if (cart.length === 0) {
      return 'Add Items Before Checkout';
    }

    if (isSending) {
      return 'Sending...';
    }

    return 'Submit Checkout';
  }

  function renderCartSummary() {
    if (cart.length === 0) {
      return (
        <div className="alert alert-warning mb-0">
          No cart items were found. Add items from the store page before submitting checkout.
        </div>
      );
    }

    return (
      <>
        {cart.map(function(item, index) {
          return (
            <div className="border-bottom py-2" key={item.productID + '-' + index}>
              <div className="fw-semibold">{item.description}</div>
              <div>{item.productID} | {item.category} | ${Number(item.price).toFixed(2)}</div>
            </div>
          );
        })}
        <div className="mt-3 fw-bold">Total: ${cartTotal.toFixed(2)}</div>
      </>
    );
  }

  function renderSuccessScreen() {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="product-form text-center">
              <h2 className="mb-3">Checkout Submitted</h2>
              <p className="lead mb-3">Your order was sent for admin review.</p>
              {completedOrder && (
                <div className="alert alert-success text-start">
                  <div><strong>Order ID:</strong> {completedOrder.id}</div>
                  <div><strong>Status:</strong> Pending</div>
                  <div><strong>Total:</strong> ${Number(completedOrder.total || 0).toFixed(2)}</div>
                </div>
              )}
              <div className="d-flex justify-content-center gap-2 flex-wrap">
                <a className="btn btn-primary" href="#orders">View Orders</a>
                <a className="btn btn-outline-primary" href="#store">Back to Store</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderLoginRequired() {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-7">
            <div className="product-form text-center">
              <h2 className="mb-3">Login Required</h2>
              <p className="mb-4">Please create an account or log in before checkout.</p>
              <div className="d-flex justify-content-center gap-2 flex-wrap">
                <a className="btn btn-primary" href="#login">Login</a>
                <a className="btn btn-outline-primary" href="#signup">Create Account</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderSignedInPhone() {
    if (formData.phone) {
      return <div>{formData.phone}</div>;
    }

    return <div>Add a phone number below so we can contact you about this order.</div>;
  }

  function renderContactSection() {
    if (authUser && authUser.role === 'member') {
      return (
        <>
          <div className="col-12">
            <div className="alert alert-info mb-0">
              <strong>Signed in as {formData.fullName || authUser.name}.</strong>
              <div>{formData.email || authUser.email}</div>
              {renderSignedInPhone()}
            </div>
          </div>

          {!authUser.phone && (
            <div className="col-md-6">
              <label htmlFor="phone" className="form-label">Phone Number *</label>
              <input type="tel" className={getControlClass('form-control', 'phone')} id="phone" name="phone" placeholder="555-123-4567" value={formData.phone} onChange={handleChange} required />
              {checkoutErrors.phone && <div className="invalid-feedback">{checkoutErrors.phone}</div>}
            </div>
          )}
        </>
      );
    }

    return (
      <>
        <div className="col-md-6">
          <label htmlFor="fullName" className="form-label">Full Name *</label>
          <input type="text" className={getControlClass('form-control', 'fullName')} id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
          {checkoutErrors.fullName && <div className="invalid-feedback">{checkoutErrors.fullName}</div>}
        </div>

        <div className="col-md-6">
          <label htmlFor="email" className="form-label">Email *</label>
          <input type="email" className={getControlClass('form-control', 'email')} id="email" name="email" value={formData.email} onChange={handleChange} required />
          {checkoutErrors.email && <div className="invalid-feedback">{checkoutErrors.email}</div>}
        </div>

        <div className="col-md-6">
          <label htmlFor="phone" className="form-label">Phone Number *</label>
          <input type="tel" className={getControlClass('form-control', 'phone')} id="phone" name="phone" placeholder="555-123-4567" value={formData.phone} onChange={handleChange} required />
          {checkoutErrors.phone && <div className="invalid-feedback">{checkoutErrors.phone}</div>}
        </div>
      </>
    );
  }

  if (!authUser || authUser.role !== 'member') {
    return renderLoginRequired();
  }

  if (completedOrder) {
    return renderSuccessScreen();
  }

  return (
    <div className="container py-5">
      <h2 className="mb-3">Checkout</h2>
      <p className="text-muted">
        Confirm your contact details and send the cart for approval.
      </p>

      {!authUser && (
        <div className="alert alert-info d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span>Create a profile first so orders and returns are easier to find later.</span>
          <a className="btn btn-sm btn-outline-primary" href="#signup">Create Profile</a>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-7">
          <form onSubmit={handleSubmit} className="card shadow-sm border-0 p-4" noValidate>
            <div className="row g-3">
              {renderContactSection()}

              <div className="col-12">
                <h3 className="h5 mt-3 mb-0">Shipping</h3>
              </div>

              <div className="col-md-6">
                <label htmlFor="pickupMethod" className="form-label">Shipping / Pickup Option *</label>
                <select className={getControlClass('form-select', 'pickupMethod')} id="pickupMethod" name="pickupMethod" value={formData.pickupMethod} onChange={handleChange} required>
                  <option value="">Select Option</option>
                  <option value="Club Pickup">Club Pickup</option>
                  <option value="Event Booth Pickup">Event Booth Pickup</option>
                  <option value="Digital Ticket Email">Digital Ticket Email</option>
                </select>
                {checkoutErrors.pickupMethod && <div className="invalid-feedback">{checkoutErrors.pickupMethod}</div>}
              </div>

              <div className="col-md-6">
                <label htmlFor="shippingAddress" className="form-label">Shipping / Pickup Location *</label>
                <input type="text" className={getControlClass('form-control', 'shippingAddress')} id="shippingAddress" name="shippingAddress" placeholder="Campus address, event booth, or email delivery note" value={formData.shippingAddress} onChange={handleChange} required />
                {checkoutErrors.shippingAddress && <div className="invalid-feedback">{checkoutErrors.shippingAddress}</div>}
              </div>

              <div className="col-12">
                <h3 className="h5 mt-3 mb-0">Billing</h3>
              </div>

              <div className="col-md-6">
                <label htmlFor="paymentMethod" className="form-label">Payment Method *</label>
                <select className={getControlClass('form-select', 'paymentMethod')} id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} required>
                  <option value="">Select Method</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Campus Transfer">Campus Transfer</option>
                </select>
                {checkoutErrors.paymentMethod && <div className="invalid-feedback">{checkoutErrors.paymentMethod}</div>}
              </div>

              <div className="col-md-6">
                <label htmlFor="billingName" className="form-label">Billing Name *</label>
                <input type="text" className={getControlClass('form-control', 'billingName')} id="billingName" name="billingName" value={formData.billingName} onChange={handleChange} required />
                {checkoutErrors.billingName && <div className="invalid-feedback">{checkoutErrors.billingName}</div>}
              </div>

              <div className="col-12">
                <label htmlFor="billingAddress" className="form-label">Billing Address *</label>
                <input type="text" className={getControlClass('form-control', 'billingAddress')} id="billingAddress" name="billingAddress" value={formData.billingAddress} onChange={handleChange} required />
                {checkoutErrors.billingAddress && <div className="invalid-feedback">{checkoutErrors.billingAddress}</div>}
              </div>

              <div className="col-12">
                <label htmlFor="notes" className="form-label">Additional Notes (Optional)</label>
                <textarea className="form-control" id="notes" name="notes" rows="4" value={formData.notes} onChange={handleChange}></textarea>
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input className={getControlClass('form-check-input', 'agreeToTerms')} type="checkbox" id="agreeToTerms" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange} />
                  <label className="form-check-label" htmlFor="agreeToTerms">
                    I confirm that the order information is correct.
                  </label>
                  {checkoutErrors.agreeToTerms && <div className="invalid-feedback d-block">{checkoutErrors.agreeToTerms}</div>}
                </div>
              </div>
            </div>

            {statusMessage.text && (
              <div className={'alert alert-' + statusMessage.type + ' mt-4'} role="alert">
                {statusMessage.text}
              </div>
            )}

            <div className="mt-4 d-flex gap-2 flex-wrap">
              <button className="btn btn-success" type="submit" disabled={isSending || cart.length === 0}>
                {getButtonText()}
              </button>
            </div>
          </form>
        </div>

        <div className="col-lg-5">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                <h4 className="h5 mb-0">Cart Summary</h4>
                <a className="btn btn-outline-primary btn-sm" href="#store">
                  Back to Store
                </a>
              </div>
              {renderCartSummary()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
