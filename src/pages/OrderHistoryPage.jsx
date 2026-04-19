import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api/apiConfig";

function getStoredCustomerEmail() {
  const savedEmail = localStorage.getItem("customerEmail");

  if (savedEmail) {
    return savedEmail;
  }

  return "";
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getStatusClass(status) {
  if (status === "approved") {
    return "bg-success";
  }

  if (status === "declined") {
    return "bg-danger";
  }

  return "bg-warning text-dark";
}

function formatStatus(status) {
  if (!status) {
    return "Pending";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "No date saved";
  }

  const date = new Date(dateValue);

  if (isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleString();
}

function getPickupMethod(order) {
  if (order.options && order.options.pickupMethod) {
    return order.options.pickupMethod;
  }

  return "N/A";
}

function getPaymentMethod(order) {
  if (order.options && order.options.paymentMethod) {
    return order.options.paymentMethod;
  }

  return "N/A";
}

function getTotal(order) {
  const total = Number(order.total || 0);
  return total.toFixed(2);
}

export default function OrderHistoryPage() {
  const [customerEmail, setCustomerEmail] = useState(getStoredCustomerEmail);
  const [lookupEmail, setLookupEmail] = useState(getStoredCustomerEmail);
  const [lookupError, setLookupError] = useState("");
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  function loadOrders(emailValue) {
    const normalizedEmail = normalizeEmail(emailValue);

    if (!isValidEmail(normalizedEmail)) {
      setLookupError("Enter the email address used at checkout.");
      setMessage("");
      setOrders([]);
      return;
    }

    setMessage("");

    fetch(API_BASE_URL + "/members?email=" + encodeURIComponent(normalizedEmail))
      .then(function(res) {
        if (!res.ok) {
          throw new Error("Request failed");
        }

        return res.json();
      })
      .then(function(memberData) {
        if (!Array.isArray(memberData) || memberData.length === 0) {
          localStorage.removeItem("customerEmail");
          setCustomerEmail("");
          setLookupEmail(normalizedEmail);
          setOrders([]);
          setLookupError("That email is not registered as a member yet. Register first, then check orders.");
          throw new Error("MEMBER_NOT_FOUND");
        }

        return fetch(API_BASE_URL + "/orders?customerEmail=" + encodeURIComponent(normalizedEmail));
      })
      .then(function(res) {
        if (!res.ok) {
          throw new Error("Request failed");
        }

        return res.json();
      })
      .then(function(data) {
        localStorage.setItem("customerEmail", normalizedEmail);
        setCustomerEmail(normalizedEmail);
        setLookupEmail(normalizedEmail);
        setOrders(data);
        setLookupError("");
        setMessage("");
      })
      .catch(function(error) {
        if (error.message === "MEMBER_NOT_FOUND") {
          return;
        }

        setMessage("Your orders could not be loaded. Make sure the Node.js server is running.");
      });
  }

  function handleLookupSubmit(event) {
    event.preventDefault();
    loadOrders(lookupEmail);
  }

  function handleUseDifferentEmail() {
    localStorage.removeItem("customerEmail");
    setCustomerEmail("");
    setLookupEmail(customerEmail);
    setLookupError("");
    setMessage("");
    setOrders([]);
  }

  function renderOrderItems(order) {
    if (!order.cart || order.cart.length === 0) {
      return <p className="mb-0">No item details saved.</p>;
    }

    return (
      <ul className="mt-2 mb-0">
        {order.cart.map(function(item, itemIndex) {
          return (
            <li key={(item.productID || "item") + itemIndex}>
              {item.description || "Item"} ({item.productID || "No ID"}) - ${Number(item.price || 0).toFixed(2)}
            </li>
          );
        })}
      </ul>
    );
  }

  function renderNotes(order) {
    if (order.options && order.options.notes) {
      return <div className="mt-2">Notes: {order.options.notes}</div>;
    }

    return null;
  }

  function renderLookupForm() {
    return (
      <form onSubmit={handleLookupSubmit} className="card shadow-sm border-0 p-4 my-orders-lookup" noValidate>
        <div className="row g-3 align-items-end">
          <div className="col-md-8">
            <label htmlFor="orderEmail" className="form-label">Checkout Email</label>
            <input
              type="email"
              className={lookupError ? "form-control is-invalid" : "form-control"}
              id="orderEmail"
              value={lookupEmail}
              onChange={function(event) {
                setLookupEmail(event.target.value);
                setLookupError("");
              }}
              placeholder="you@example.com"
              required
            />
            {lookupError && <div className="invalid-feedback">{lookupError}</div>}
          </div>

          <div className="col-md-4">
            <button className="btn btn-primary w-100" type="submit">
              Find My Orders
            </button>
          </div>
        </div>
      </form>
    );
  }

  function renderOrders() {
    if (orders.length === 0) {
      return <div className="alert alert-info">No orders were found for {customerEmail}.</div>;
    }

    return (
      <div className="table-responsive">
        <table className="table table-bordered table-striped align-middle bg-white">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Date</th>
              <th>Details</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {orders.map(function(order, index) {
              return (
                <tr key={order.id || index}>
                  <td>{order.id || "No ID"}</td>
                  <td>
                    <span className={"badge status-badge " + getStatusClass(order.status)}>
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td>{formatDate(order.date)}</td>
                  <td>
                    <div>Delivery/Pickup: {getPickupMethod(order)}</div>
                    <div>Payment: {getPaymentMethod(order)}</div>
                    {renderOrderItems(order)}
                    {renderNotes(order)}
                  </td>
                  <td className="fw-bold">${getTotal(order)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  useEffect(function() {
    if (customerEmail) {
      loadOrders(customerEmail);
    }
  }, []);

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="mb-1">My Orders</h2>
          <p className="text-muted mb-0">Look up orders using the email address from checkout.</p>
        </div>

        {customerEmail && (
          <button className="btn btn-outline-primary" type="button" onClick={function() { loadOrders(customerEmail); }}>
            Reload My Orders
          </button>
        )}
      </div>

      {!customerEmail && renderLookupForm()}

      {message && <div className="alert alert-danger">{message}</div>}

      {customerEmail && (
        <>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <p className="mb-0">
              Showing orders for <strong>{customerEmail}</strong>
            </p>

            <button className="btn btn-outline-dark" type="button" onClick={handleUseDifferentEmail}>
              Use a Different Email
            </button>
          </div>

          {renderOrders()}
        </>
      )}
    </div>
  );
}
