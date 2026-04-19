import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api/apiConfig";

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

function getCustomerName(order) {
  if (order.customer && order.customer.fullName) {
    return order.customer.fullName;
  }

  if (order.name) {
    return order.name;
  }

  return "Unknown Customer";
}

function getCustomerEmail(order) {
  if (order.customer && order.customer.email) {
    return order.customer.email;
  }

  return "No email saved";
}

function getCustomerPhone(order) {
  if (order.customer && order.customer.phone) {
    return order.customer.phone;
  }

  return "";
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

export default function ApprovalPage() {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  function load() {
    fetch(API_BASE_URL + "/orders/pending")
      .then(function(res) {
        if (!res.ok) {
          throw new Error("Request failed");
        }

        return res.json();
      })
      .then(function(data) {
        setOrders(data);
        setMessage("");
      })
      .catch(function() {
        setMessage("Pending orders could not be loaded. Make sure the Node.js server is running.");
      });
  }

  function update(id, status) {
    fetch(API_BASE_URL + "/orders/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status })
    })
      .then(function(res) {
        if (!res.ok) {
          throw new Error("Request failed");
        }

        return res.json();
      })
      .then(function() {
        load();
      })
      .catch(function() {
        setMessage("Status could not be updated.");
      });
  }

  function renderOrderItems(order) {
    if (!order.cart || order.cart.length === 0) {
      return <p className="mb-0">No item details saved.</p>;
    }

    return (
      <ul className="mb-0">
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
      return (
        <div className="mt-3">
          <div className="order-label">Notes</div>
          <div>{order.options.notes}</div>
        </div>
      );
    }

    return null;
  }

  function renderOrders() {
    if (orders.length === 0) {
      return <div className="alert alert-success">There are no pending orders right now.</div>;
    }

    return (
      <div className="row g-3">
        {orders.map(function(order, index) {
          return (
            <div key={order.id || index} className="col-12">
              <div className="card approval-card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div>
                      <h5 className="card-title mb-1">Order #{order.id || "No ID"}</h5>
                      <div className="text-muted">Submitted: {formatDate(order.date)}</div>
                    </div>

                    <span className="badge status-badge bg-warning text-dark">Pending</span>
                  </div>

                  <hr />

                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="order-label">Customer</div>
                      <div>{getCustomerName(order)}</div>
                      <div className="text-muted">{getCustomerEmail(order)}</div>
                      {getCustomerPhone(order) && <div className="text-muted">{getCustomerPhone(order)}</div>}
                    </div>

                    <div className="col-md-4">
                      <div className="order-label">Order Options</div>
                      <div>Delivery/Pickup: {getPickupMethod(order)}</div>
                      <div>Payment: {getPaymentMethod(order)}</div>
                    </div>

                    <div className="col-md-4">
                      <div className="order-label">Total</div>
                      <div className="fw-bold">${getTotal(order)}</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="order-label">Items / Details</div>
                    {renderOrderItems(order)}
                  </div>

                  {renderNotes(order)}

                  <div className="mt-4">
                    <button
                      className="btn btn-success me-2"
                      onClick={function() { update(order.id, "approved"); }}
                    >
                      Approve
                    </button>

                    <button
                      className="btn btn-danger"
                      onClick={function() { update(order.id, "declined"); }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  useEffect(load, []);

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="mb-1">Admin Review</h2>
          <p className="text-muted mb-0">Review pending orders and approve or decline each one.</p>
        </div>

        <button className="btn btn-outline-primary" type="button" onClick={load}>
          Reload Orders
        </button>
      </div>

      {message && <div className="alert alert-danger">{message}</div>}
      {renderOrders()}
    </div>
  );
}
