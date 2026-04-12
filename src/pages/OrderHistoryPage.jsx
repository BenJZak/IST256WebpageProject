import { useEffect, useState } from "react";

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
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

  function loadOrders() {
    fetch("/api/orders")
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
        setMessage("Order history could not be loaded. Make sure the Node.js server is running.");
      });
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

  function renderOrders() {
    if (orders.length === 0) {
      return <div className="alert alert-info">No orders have been submitted yet.</div>;
    }

    return (
      <div className="table-responsive">
        <table className="table table-bordered table-striped align-middle bg-white">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
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
                    <div>{getCustomerName(order)}</div>
                    <div className="text-muted">{getCustomerEmail(order)}</div>
                  </td>
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

  useEffect(loadOrders, []);

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="mb-1">Order History</h2>
          <p className="text-muted mb-0">All submitted orders and their current approval status.</p>
        </div>

        <button className="btn btn-outline-primary" type="button" onClick={loadOrders}>
          Reload Orders
        </button>
      </div>

      {message && <div className="alert alert-danger">{message}</div>}
      {renderOrders()}
    </div>
  );
}
