import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api/apiConfig';
import { defaultReturnRequest } from '../data/defaultData';
import { getAuthHeaders, getStoredUser } from '../auth/session';

function getStoredCustomerEmail() {
  const user = getStoredUser();

  if (user && user.role === 'member' && user.email) {
    return user.email;
  }

  return localStorage.getItem('customerEmail') || '';
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function buildApiUrl(path, searchKey, searchValue) {
  const url = new URL(API_BASE_URL + path);
  url.searchParams.set(searchKey, searchValue);
  return url.toString();
}

function formatDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);

  if (isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleString();
}

function formatStatus(status) {
  if (status === 'resolved') {
    return 'Complete';
  }

  if (!status) {
    return 'Requested';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function ReturnsPage(props) {
  const startingEmail = getStoredCustomerEmail();
  const [authUser] = useState(getStoredUser);
  const [formData, setFormData] = useState({ ...defaultReturnRequest, email: startingEmail });
  const [lookupEmail, setLookupEmail] = useState(startingEmail);
  const [returnsList, setReturnsList] = useState([]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });
  const [submittedReturn, setSubmittedReturn] = useState(null);
  const signedInMember = authUser && authUser.role === 'member';

  function loadReturns(emailValue) {
    const email = normalizeEmail(emailValue);

    if (email === '') {
      setReturnsList([]);
      return;
    }

    fetch(buildApiUrl('/returns', 'email', email), {
      headers: getAuthHeaders()
    })
      .then(function(res) {
        if (!res.ok) {
          throw new Error('Request failed');
        }

        return res.json();
      })
      .then(function(data) {
        setReturnsList(data);
      })
      .catch(function() {
        setMessage({ text: 'Return requests could not be loaded right now. Please try again in a moment.', type: 'danger' });
      });
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });

    if (message.text) {
      setMessage({ text: '', type: '' });
    }

    if (errors[name]) {
      const nextErrors = { ...errors };
      delete nextErrors[name];
      setErrors(nextErrors);
    }
  }

  function getErrors() {
    const nextErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (formData.orderID === '' || Number(formData.orderID) <= 0) {
      nextErrors.orderID = 'Enter the order ID from Orders.';
    }

    if (formData.email.trim() === '') {
      nextErrors.email = 'Enter the email used on the order.';
    } else if (!emailPattern.test(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (formData.reason.trim() === '') {
      nextErrors.reason = 'Enter a return reason.';
    }

    return nextErrors;
  }

  function getControlClass(baseClass, fieldName) {
    if (errors[fieldName]) {
      return baseClass + ' is-invalid';
    }

    return baseClass;
  }

  function renderError(fieldName) {
    if (!errors[fieldName]) {
      return null;
    }

    return <div className="invalid-feedback">{errors[fieldName]}</div>;
  }

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = getErrors();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setMessage({ text: 'Please fix the highlighted return fields.', type: 'danger' });
      return;
    }

    const payload = {
      orderID: Number(formData.orderID),
      email: normalizeEmail(formData.email),
      reason: formData.reason.trim(),
      notes: formData.notes.trim()
    };

    fetch(API_BASE_URL + '/returns', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    })
      .then(function(res) {
        return res.json().then(function(data) {
          if (!res.ok) {
            throw new Error(data.message || 'Return request could not be saved.');
          }

          return data;
        });
      })
      .then(function(data) {
        localStorage.setItem('customerEmail', payload.email);
        setLookupEmail(payload.email);
        setSubmittedReturn(data);
        setFormData({ ...defaultReturnRequest, email: payload.email });
        setErrors({});
        setMessage({ text: 'Return request submitted. An admin will review it soon.', type: 'success' });
        loadReturns(payload.email);
      })
      .catch(function(error) {
        setMessage({ text: error.message || 'Return request could not be saved.', type: 'danger' });
      });
  }

  function startAnotherReturn() {
    setSubmittedReturn(null);
    setMessage({ text: '', type: '' });
  }

  function getPageClassName() {
    if (props.embedded) {
      return '';
    }

    return 'container py-5';
  }

  function renderPageHeading() {
    if (props.embedded) {
      return <h3 className="mb-1">Returns</h3>;
    }

    return <h2 className="mb-1">Returns</h2>;
  }

  function renderFindOrderButton() {
    if (props.embedded) {
      return null;
    }

    return <a href="#orders" className="btn btn-outline-primary">Find Order ID</a>;
  }

  function renderEmailField() {
    return (
      <div className="col-md-8">
        <div className="alert alert-info mb-0">
          <strong>Signed in as {authUser.name}.</strong>
          <div>{authUser.email}</div>
        </div>
      </div>
    );
  }

  function renderSuccessScreen() {
    if (!submittedReturn) {
      return null;
    }

    return (
      <div className="product-form">
        <h3 className="h4 mb-3">Return Request Sent</h3>
        <p>Your request was saved and is ready for admin review.</p>
        <div className="alert alert-success">
          <div><strong>Return ID:</strong> {submittedReturn.returnID}</div>
          <div><strong>Order ID:</strong> {submittedReturn.orderID}</div>
          <div><strong>Status:</strong> Requested</div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-primary" type="button" onClick={startAnotherReturn}>Submit Another Return</button>
          <a className="btn btn-outline-primary" href="#orders">View Orders</a>
        </div>
      </div>
    );
  }

  function renderReturnForm() {
    if (submittedReturn) {
      return renderSuccessScreen();
    }

    return (
      <form onSubmit={handleSubmit} className="product-form" noValidate>
        <div className="row g-3">
          <div className="col-md-4">
            <label htmlFor="returnOrderID" className="form-label">Order ID *</label>
            <input id="returnOrderID" name="orderID" type="number" className={getControlClass('form-control', 'orderID')} value={formData.orderID} onChange={handleChange} />
            {renderError('orderID')}
          </div>

          {renderEmailField()}

          <div className="col-12">
            <label htmlFor="returnReason" className="form-label">Return Reason *</label>
            <input id="returnReason" name="reason" className={getControlClass('form-control', 'reason')} value={formData.reason} onChange={handleChange} />
            {renderError('reason')}
          </div>

          <div className="col-12">
            <label htmlFor="returnNotes" className="form-label">Notes</label>
            <textarea id="returnNotes" name="notes" rows="4" className="form-control" value={formData.notes} onChange={handleChange}></textarea>
          </div>
        </div>

        <div className="mt-4">
          <button className="btn btn-success" type="submit">Submit Return</button>
        </div>
      </form>
    );
  }

  function renderReturns() {
    if (returnsList.length === 0) {
      return <div className="alert alert-info">No return requests found for this email.</div>;
    }

    return (
      <div className="table-scroll">
        <table className="table table-bordered table-striped align-middle bg-white">
          <thead>
            <tr>
              <th>Return ID</th>
              <th>Order ID</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {returnsList.map(function(returnRequest) {
              return (
                <tr key={returnRequest.returnID}>
                  <td>{returnRequest.returnID}</td>
                  <td>{returnRequest.orderID}</td>
                  <td>{formatStatus(returnRequest.status)}</td>
                  <td>{returnRequest.reason}</td>
                  <td>{formatDate(returnRequest.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderLoginRequired() {
    return (
      <div className="product-form text-center">
        <h3 className="h4 mb-3">Login Required</h3>
        <p className="mb-4">Please log in before requesting or viewing returns.</p>
        <div className="d-flex justify-content-center gap-2 flex-wrap">
          <a className="btn btn-primary" href="#login">Login</a>
          <a className="btn btn-outline-primary" href="#signup">Create Account</a>
        </div>
      </div>
    );
  }

  useEffect(function() {
    if (signedInMember && lookupEmail) {
      loadReturns(lookupEmail);
    }
  }, []);

  if (!signedInMember) {
    return (
      <div className={getPageClassName()}>
        {renderLoginRequired()}
      </div>
    );
  }

  return (
    <div className={getPageClassName()}>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
        <div>
          {renderPageHeading()}
          <p className="text-muted mb-0">Request a return and check its review status.</p>
        </div>
        {renderFindOrderButton()}
      </div>

      {message.text && (
        <div className={'alert alert-' + message.type} role="alert">
          {message.text}
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-7">
          {renderReturnForm()}
        </div>

        <div className="col-lg-5">
          <div className="card shadow-sm border-0 p-4 mb-3">
            <div className="d-flex justify-content-between align-items-center gap-2">
              <div>
                <div className="fw-bold">Your Return Status</div>
                <div className="text-muted">{authUser.email}</div>
              </div>
              <button className="btn btn-outline-primary btn-sm" type="button" onClick={function() { loadReturns(authUser.email); }}>Reload</button>
            </div>
          </div>

          {renderReturns()}
        </div>
      </div>
    </div>
  );
}
