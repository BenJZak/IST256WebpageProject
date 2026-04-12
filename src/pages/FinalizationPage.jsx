import { useMemo, useState } from 'react';
import { defaultFinalization } from '../data/defaultData';
import { sendFinalizationData } from '../api/finalizationApi';

function getStoredCart() {
  const savedCart = localStorage.getItem('cart');
  return savedCart ? JSON.parse(savedCart) : [];
}

export default function FinalizationPage() {
  const [cart] = useState(getStoredCart);
  const [formData, setFormData] = useState(defaultFinalization);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [jsonPreview, setJsonPreview] = useState('');
  const [isSending, setIsSending] = useState(false);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + Number(item.price), 0);
  }, [cart]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    if (statusMessage.text) {
      setStatusMessage({ text: '', type: '' });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      formData.fullName.trim() === '' ||
      formData.email.trim() === '' ||
      formData.pickupMethod === '' ||
      formData.paymentMethod === ''
    ) {
      setStatusMessage({ text: 'Please complete all required fields.', type: 'danger' });
      return;
    }

    if (!formData.agreeToTerms) {
      setStatusMessage({ text: 'Please agree to the finalization terms.', type: 'danger' });
      return;
    }

    const jsonDocument = {
      customer: {
        fullName: formData.fullName.trim(),
        email: formData.email.trim()
      },
      options: {
        pickupMethod: formData.pickupMethod,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes.trim()
      },
      cart,
      total: Number(cartTotal.toFixed(2))
    };

    setJsonPreview(JSON.stringify(jsonDocument, null, 2));
    setIsSending(true);

    try {
      await sendFinalizationData(jsonDocument);
      setStatusMessage({ text: 'Finalization data sent successfully.', type: 'success' });
    } catch (error) {
      setStatusMessage({ text: 'Error sending finalization data.', type: 'danger' });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="container py-5">
      <h2 className="mb-3">Finalization Page</h2>
      <p className="text-muted">
        
      </p>

      <div className="row g-4">
        <div className="col-lg-7">
          <form onSubmit={handleSubmit} className="card shadow-sm border-0 p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="fullName" className="form-label">Full Name *</label>
                <input type="text" className="form-control" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} />
              </div>

              <div className="col-md-6">
                <label htmlFor="email" className="form-label">Email *</label>
                <input type="email" className="form-control" id="email" name="email" value={formData.email} onChange={handleChange} />
              </div>

              <div className="col-md-6">
                <label htmlFor="pickupMethod" className="form-label">Delivery / Pickup Option *</label>
                <select className="form-select" id="pickupMethod" name="pickupMethod" value={formData.pickupMethod} onChange={handleChange}>
                  <option value="">Select Option</option>
                  <option value="Club Pickup">Club Pickup</option>
                  <option value="Event Booth Pickup">Event Booth Pickup</option>
                  <option value="Digital Ticket Email">Digital Ticket Email</option>
                </select>
              </div>

              <div className="col-md-6">
                <label htmlFor="paymentMethod" className="form-label">Payment Method *</label>
                <select className="form-select" id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                  <option value="">Select Method</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Campus Transfer">Campus Transfer</option>
                </select>
              </div>

              <div className="col-12">
                <label htmlFor="notes" className="form-label">Additional Notes</label>
                <textarea className="form-control" id="notes" name="notes" rows="4" value={formData.notes} onChange={handleChange}></textarea>
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="agreeToTerms" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange} />
                  <label className="form-check-label" htmlFor="agreeToTerms">
                    I confirm that the order information is correct.
                  </label>
                </div>
              </div>
            </div>

            {statusMessage.text && (
              <div className={`alert alert-${statusMessage.type} mt-4`} role="alert">
                {statusMessage.text}
              </div>
            )}

            <div className="mt-4 d-flex gap-2 flex-wrap">
              <button className="btn btn-success" type="submit" disabled={isSending}>
                {isSending ? 'Sending...' : 'Submit Finalization'}
              </button>
            </div>
          </form>
        </div>

        <div className="col-lg-5">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <h4 className="h5">Cart Summary</h4>
              {cart.length === 0 ? (
                <p className="mb-0">No cart items were found. Add items from the storefront page first.</p>
              ) : (
                <>
                  {cart.map((item, index) => (
                    <div className="border-bottom py-2" key={`${item.productID}-${index}`}>
                      <div className="fw-semibold">{item.description}</div>
                      <div>{item.productID} | {item.category} | ${Number(item.price).toFixed(2)}</div>
                    </div>
                  ))}
                  <div className="mt-3 fw-bold">Total: ${cartTotal.toFixed(2)}</div>
                </>
              )}
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h4 className="h5">JSON Preview</h4>
              <pre className="json-preview mb-0">{jsonPreview || 'Submit the form to generate the JSON document preview.'}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

