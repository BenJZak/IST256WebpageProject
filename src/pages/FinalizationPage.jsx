import { useState } from 'react';
import { defaultFinalization } from '../data/defaultData';
import { sendFinalizationData } from '../api/finalizationApi';

function getStoredCart() {
  const savedCart = localStorage.getItem('cart');

  if (savedCart) {
    return JSON.parse(savedCart);
  }

  return [];
}

export default function FinalizationPage() {
  const [cart] = useState(getStoredCart);
  const [formData, setFormData] = useState(defaultFinalization);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [checkoutErrors, setCheckoutErrors] = useState({});
  const [isSending, setIsSending] = useState(false);

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

    setFormData({
      ...formData,
      [name]: fieldValue
    });

    if (statusMessage.text) {
      setStatusMessage({ text: '', type: '' });
    }

    if (checkoutErrors[name]) {
      const nextErrors = { ...checkoutErrors };
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
      errors.pickupMethod = 'Choose a delivery or pickup option.';
    }

    if (formData.paymentMethod === '') {
      errors.paymentMethod = 'Choose a payment method.';
    }

    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'Confirm the order information before submitting.';
    }

    return errors;
  }

  function getControlClass(baseClass, fieldName) {
    if (checkoutErrors[fieldName]) {
      return `${baseClass} is-invalid`;
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
      status: 'pending',
      customer: {
        fullName: formData.fullName.trim(),
        email: normalizedEmail,
        phone: formData.phone.trim()
      },
      options: {
        pickupMethod: formData.pickupMethod,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes.trim()
      },
      cart,
      total: Number(cartTotal.toFixed(2))
    };

    setIsSending(true);

    sendFinalizationData(jsonDocument)
    .then(function() {
      localStorage.setItem('customerEmail', normalizedEmail);
      setStatusMessage({ text: 'Checkout submitted successfully! Your email is registered for My Orders, and an admin will review the order.', type: 'success' });
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

  return (
    <div className="container py-5">
      <h2 className="mb-3">Checkout</h2>
      <p className="text-muted">
        Confirm your contact details and send the cart for approval.
      </p>

      <div className="row g-4">
        <div className="col-lg-7">
          <form onSubmit={handleSubmit} className="card shadow-sm border-0 p-4" noValidate>
            <div className="row g-3">
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

              <div className="col-md-6">
                <label htmlFor="pickupMethod" className="form-label">Delivery / Pickup Option *</label>
                <select className={getControlClass('form-select', 'pickupMethod')} id="pickupMethod" name="pickupMethod" value={formData.pickupMethod} onChange={handleChange} required>
                  <option value="">Select Option</option>
                  <option value="Club Pickup">Club Pickup</option>
                  <option value="Event Booth Pickup">Event Booth Pickup</option>
                  <option value="Digital Ticket Email">Digital Ticket Email</option>
                </select>
                {checkoutErrors.pickupMethod && <div className="invalid-feedback">{checkoutErrors.pickupMethod}</div>}
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
              <div className={`alert alert-${statusMessage.type} mt-4`} role="alert">
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
