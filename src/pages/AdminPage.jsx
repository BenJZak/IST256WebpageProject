import { useEffect, useState } from "react";
import { API_BASE_URL } from "../api/apiConfig";

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

const emptyProductForm = {
  description: "",
  price: "",
  category: "",
  unit: "",
  weight: "",
  color: ""
};

const emptyMemberForm = {
  name: "",
  email: "",
  year: "",
  affiliation: "",
  phone: ""
};

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export default function AdminPage() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [members, setMembers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productFormData, setProductFormData] = useState(emptyProductForm);
  const [productErrors, setProductErrors] = useState({});
  const [productMessage, setProductMessage] = useState({ text: "", type: "" });
  const [memberFormData, setMemberFormData] = useState(emptyMemberForm);
  const [memberErrors, setMemberErrors] = useState({});
  const [memberMessage, setMemberMessage] = useState({ text: "", type: "" });
  const [editingMemberID, setEditingMemberID] = useState(null);
  const [message, setMessage] = useState("");

  const memberSubmitLabel = editingMemberID === null ? "Register Member" : "Update Member";

  function loadPendingOrders() {
    return fetch(API_BASE_URL + "/orders/pending")
      .then(function(res) {
        if (!res.ok) {
          throw new Error("Request failed");
        }

        return res.json();
      })
      .then(function(data) {
        setPendingOrders(data);
      });
  }

  function loadAllOrders() {
    return fetch(API_BASE_URL + "/orders")
      .then(function(res) {
        if (!res.ok) {
          throw new Error("Request failed");
        }

        return res.json();
      })
      .then(function(data) {
        setAllOrders(data);
      });
  }

  function loadMembers() {
    return fetch(API_BASE_URL + "/members")
      .then(function(res) {
        if (!res.ok) {
          throw new Error("Request failed");
        }

        return res.json();
      })
      .then(function(data) {
        setMembers(data);
      });
  }

  function loadProducts() {
    return fetch(API_BASE_URL + "/products")
      .then(function(res) {
        if (!res.ok) {
          throw new Error("Request failed");
        }

        return res.json();
      })
      .then(function(data) {
        setProducts(data);
      });
  }

  function loadAdminData() {
    Promise.all([loadPendingOrders(), loadAllOrders(), loadMembers(), loadProducts()])
      .then(function() {
        setMessage("");
      })
      .catch(function() {
        setMessage("Admin data could not be loaded. Make sure the Node.js server is running.");
      });
  }

  function updateOrderStatus(id, status) {
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
        loadAdminData();
      })
      .catch(function() {
        setMessage("Status could not be updated.");
      });
  }

  function clearProductForm() {
    setProductFormData(emptyProductForm);
    setProductErrors({});
  }

  function handleProductChange(event) {
    const name = event.target.name;
    const value = event.target.value;
    setProductFormData({ ...productFormData, [name]: value });

    if (productMessage.text) {
      setProductMessage({ text: "", type: "" });
    }

    if (productErrors[name]) {
      const nextErrors = { ...productErrors };
      delete nextErrors[name];
      setProductErrors(nextErrors);
    }
  }

  function getProductErrors() {
    const errors = {};

    if (productFormData.price === "") {
      errors.price = "Enter a product price.";
    } else if (isNaN(Number(productFormData.price)) || Number(productFormData.price) <= 0) {
      errors.price = "Price must be greater than 0.";
    }

    if (productFormData.category === "") {
      errors.category = "Choose a category.";
    }

    if (productFormData.unit === "") {
      errors.unit = "Choose a unit.";
    }

    return errors;
  }

  function getProductControlClass(baseClass, fieldName) {
    if (productErrors[fieldName]) {
      return baseClass + " is-invalid";
    }

    return baseClass;
  }

  function handleProductSubmit(event) {
    event.preventDefault();

    const errors = getProductErrors();

    if (Object.keys(errors).length > 0) {
      setProductErrors(errors);
      setProductMessage({ text: "Please fix the highlighted product fields.", type: "danger" });
      return;
    }

    fetch(API_BASE_URL + "/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: productFormData.description.trim(),
        price: Number(productFormData.price),
        category: productFormData.category,
        unit: productFormData.unit,
        weight: productFormData.weight.trim(),
        color: productFormData.color.trim()
      })
    })
      .then(function(res) {
        return res.json().then(function(data) {
          if (!res.ok) {
            throw new Error(data.message || "Product could not be saved.");
          }

          return data;
        });
      })
      .then(function() {
        clearProductForm();
        setProductMessage({ text: "Product added to the store.", type: "success" });
        loadProducts();
      })
      .catch(function(error) {
        setProductMessage({ text: error.message || "Product could not be saved.", type: "danger" });
      });
  }

  function deleteProduct(productID) {
    if (!window.confirm("Delete product " + productID + " from the store?")) {
      return;
    }

    fetch(API_BASE_URL + "/products/" + encodeURIComponent(productID), {
      method: "DELETE"
    })
      .then(function(res) {
        return res.json().then(function(data) {
          if (!res.ok) {
            throw new Error(data.message || "Product could not be deleted.");
          }

          return data;
        });
      })
      .then(function() {
        setProductMessage({ text: "Product deleted from the store.", type: "success" });
        loadProducts();
      })
      .catch(function(error) {
        setProductMessage({ text: error.message || "Product could not be deleted.", type: "danger" });
      });
  }

  function clearMemberForm() {
    setMemberFormData(emptyMemberForm);
    setMemberErrors({});
    setEditingMemberID(null);
  }

  function handleMemberChange(event) {
    const name = event.target.name;
    const value = event.target.value;
    setMemberFormData({ ...memberFormData, [name]: value });

    if (memberMessage.text) {
      setMemberMessage({ text: "", type: "" });
    }

    if (memberErrors[name]) {
      const nextErrors = { ...memberErrors };
      delete nextErrors[name];
      setMemberErrors(nextErrors);
    }
  }

  function getMemberErrors() {
    const errors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (memberFormData.name.trim() === "") {
      errors.name = "Enter the member name.";
    }

    if (memberFormData.email.trim() === "") {
      errors.email = "Enter an email address.";
    } else if (!emailPattern.test(memberFormData.email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    if (memberFormData.year.trim() !== "" && Number(memberFormData.year) <= 0) {
      errors.year = "Year or age must be greater than 0.";
    }

    return errors;
  }

  function getMemberControlClass(baseClass, fieldName) {
    if (memberErrors[fieldName]) {
      return baseClass + " is-invalid";
    }

    return baseClass;
  }

  function handleMemberSubmit(event) {
    event.preventDefault();

    const errors = getMemberErrors();

    if (Object.keys(errors).length > 0) {
      setMemberErrors(errors);
      setMemberMessage({ text: "Please fix the highlighted member fields.", type: "danger" });
      return;
    }

    const memberData = {
      name: memberFormData.name.trim(),
      email: normalizeEmail(memberFormData.email),
      year: memberFormData.year.trim(),
      affiliation: memberFormData.affiliation.trim(),
      phone: memberFormData.phone.trim()
    };
    const isEditing = editingMemberID !== null;
    const url = isEditing ? API_BASE_URL + "/members/" + editingMemberID : API_BASE_URL + "/members";
    const method = isEditing ? "PUT" : "POST";

    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberData)
    })
      .then(function(res) {
        return res.json().then(function(data) {
          if (!res.ok) {
            throw new Error(data.message || "Member could not be saved.");
          }

          return data;
        });
      })
      .then(function() {
        clearMemberForm();
        setMemberMessage({
          text: isEditing ? "Member updated in the system." : "Member registered in the system.",
          type: "success"
        });
        loadMembers();
      })
      .catch(function(error) {
        setMemberMessage({ text: error.message || "Member could not be saved.", type: "danger" });
      });
  }

  function editMember(member) {
    setMemberFormData({
      name: member.name || "",
      email: member.email || "",
      year: member.year || "",
      affiliation: member.affiliation || "",
      phone: member.phone || ""
    });
    setEditingMemberID(member.id);
    setMemberErrors({});
    setMemberMessage({ text: "", type: "" });
  }

  function deleteMember(member) {
    if (!window.confirm("Remove " + (member.name || member.email || "this member") + " from the system?")) {
      return;
    }

    fetch(API_BASE_URL + "/members/" + member.id, {
      method: "DELETE"
    })
      .then(function(res) {
        return res.json().then(function(data) {
          if (!res.ok) {
            throw new Error(data.message || "Member could not be removed.");
          }

          return data;
        });
      })
      .then(function() {
        if (editingMemberID === member.id) {
          clearMemberForm();
        }

        setMemberMessage({ text: "Member removed from the system.", type: "success" });
        loadMembers();
      })
      .catch(function(error) {
        setMemberMessage({ text: error.message || "Member could not be removed.", type: "danger" });
      });
  }

  function renderOrderItems(order, listClassName) {
    if (!order.cart || order.cart.length === 0) {
      return <p className="mb-0">No item details saved.</p>;
    }

    return (
      <ul className={listClassName}>
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

  function renderPendingOrders() {
    if (pendingOrders.length === 0) {
      return <div className="alert alert-success">There are no pending orders right now.</div>;
    }

    return (
      <div className="row g-3">
        {pendingOrders.map(function(order, index) {
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
                    {renderOrderItems(order, "mb-0")}
                  </div>

                  {renderNotes(order)}

                  <div className="mt-4">
                    <button
                      className="btn btn-success me-2"
                      onClick={function() { updateOrderStatus(order.id, "approved"); }}
                    >
                      Approve
                    </button>

                    <button
                      className="btn btn-danger"
                      onClick={function() { updateOrderStatus(order.id, "declined"); }}
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

  function renderAllOrders() {
    if (allOrders.length === 0) {
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
            {allOrders.map(function(order, index) {
              return (
                <tr key={order.id || index}>
                  <td>{order.id || "No ID"}</td>
                  <td>
                    <div>{getCustomerName(order)}</div>
                    <div className="text-muted">{getCustomerEmail(order)}</div>
                    {getCustomerPhone(order) && <div className="text-muted">{getCustomerPhone(order)}</div>}
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
                    {renderOrderItems(order, "mt-2 mb-0")}
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

  function renderMembers() {
    if (members.length === 0) {
      return <div className="alert alert-info">No members have been registered yet.</div>;
    }

    return (
      <div className="table-responsive">
        <table className="table table-bordered table-striped align-middle bg-white">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Year</th>
              <th>Affiliation</th>
              <th>Phone</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {members.map(function(member, index) {
              return (
                <tr key={(member.id || member.email || "member") + index}>
                  <td>{member.name || "No name saved"}</td>
                  <td>{member.email || "No email saved"}</td>
                  <td>{member.year || ""}</td>
                  <td>{member.affiliation || ""}</td>
                  <td>{member.phone || ""}</td>
                  <td>{formatDate(member.registeredAt)}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-warning me-2"
                      type="button"
                      onClick={function() { editMember(member); }}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      type="button"
                      onClick={function() { deleteMember(member); }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderProducts() {
    if (products.length === 0) {
      return <div className="alert alert-info">No products are available yet.</div>;
    }

    return (
      <div className="table-responsive">
        <table className="table table-bordered table-striped align-middle bg-white">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Price</th>
              <th>Weight</th>
              <th>Color</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map(function(product, index) {
              return (
                <tr key={(product.productID || "product") + index}>
                  <td>{product.productID || "No ID"}</td>
                  <td>{product.description || "Untitled Product"}</td>
                  <td>{product.category}</td>
                  <td>{product.unit}</td>
                  <td>${Number(product.price || 0).toFixed(2)}</td>
                  <td>{product.weight || ""}</td>
                  <td>{product.color || ""}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      type="button"
                      onClick={function() { deleteProduct(product.productID); }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  useEffect(loadAdminData, []);

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="mb-1">Admin</h2>
          <p className="text-muted mb-0">Manage products, review orders, and monitor registered members.</p>
        </div>

        <button className="btn btn-outline-primary" type="button" onClick={loadAdminData}>
          Reload Admin Data
        </button>
      </div>

      {message && <div className="alert alert-danger">{message}</div>}

      <section id="products" className="mb-5">
        <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-3">
          <div>
            <h3 className="mb-1">Product Management</h3>
            <p className="text-muted mb-0">Add products to the shared store list or remove items that are no longer available.</p>
          </div>
        </div>

        <form onSubmit={handleProductSubmit} className="product-form mb-4" noValidate>
          <div className="row g-3">
            <div className="col-md-4">
              <label htmlFor="adminProductDescription" className="form-label">Description (Optional)</label>
              <input
                type="text"
                className="form-control"
                id="adminProductDescription"
                name="description"
                value={productFormData.description}
                onChange={handleProductChange}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="adminProductPrice" className="form-label">Price *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className={getProductControlClass("form-control", "price")}
                id="adminProductPrice"
                name="price"
                value={productFormData.price}
                onChange={handleProductChange}
                required
              />
              {productErrors.price && <div className="invalid-feedback">{productErrors.price}</div>}
            </div>

            <div className="col-md-4">
              <label htmlFor="adminProductCategory" className="form-label">Category *</label>
              <select
                className={getProductControlClass("form-select", "category")}
                id="adminProductCategory"
                name="category"
                value={productFormData.category}
                onChange={handleProductChange}
                required
              >
                <option value="">Select Category</option>
                <option value="Apparel">Apparel</option>
                <option value="Event">Event</option>
                <option value="Accessories">Accessories</option>
              </select>
              {productErrors.category && <div className="invalid-feedback">{productErrors.category}</div>}
            </div>

            <div className="col-md-4">
              <label htmlFor="adminProductUnit" className="form-label">Unit *</label>
              <select
                className={getProductControlClass("form-select", "unit")}
                id="adminProductUnit"
                name="unit"
                value={productFormData.unit}
                onChange={handleProductChange}
                required
              >
                <option value="">Select Unit</option>
                <option value="Each">Each</option>
                <option value="Ticket">Ticket</option>
              </select>
              {productErrors.unit && <div className="invalid-feedback">{productErrors.unit}</div>}
            </div>

            <div className="col-md-4">
              <label htmlFor="adminProductWeight" className="form-label">Weight (Optional)</label>
              <input
                type="text"
                className="form-control"
                id="adminProductWeight"
                name="weight"
                placeholder="e.g. 1 lb"
                value={productFormData.weight}
                onChange={handleProductChange}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="adminProductColor" className="form-label">Color (Optional)</label>
              <input
                type="text"
                className="form-control"
                id="adminProductColor"
                name="color"
                placeholder="e.g. Navy"
                value={productFormData.color}
                onChange={handleProductChange}
              />
            </div>
          </div>

          <div className="mt-4">
            <button type="submit" className="btn btn-success">Add Product</button>
            <button type="button" className="btn btn-secondary ms-2" onClick={clearProductForm}>Clear</button>
          </div>

          {productMessage.text && (
            <div className={"alert alert-" + productMessage.type + " mt-3"} role="alert">
              {productMessage.text}
            </div>
          )}
        </form>

        {renderProducts()}
      </section>

      <section id="review" className="mb-5">
        <h3 className="mb-3">Admin Review</h3>
        {renderPendingOrders()}
      </section>

      <section id="history">
        <h3 className="mb-3">Order History</h3>
        {renderAllOrders()}
      </section>

      <section id="members" className="mt-5">
        <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-3">
          <div>
            <h3 className="mb-1">Member Registration</h3>
            <p className="text-muted mb-0">Register members and keep their contact information synced with the server.</p>
          </div>
        </div>

        <form onSubmit={handleMemberSubmit} className="product-form mb-4" noValidate>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="adminMemberName" className="form-label">Member Name *</label>
              <input
                type="text"
                className={getMemberControlClass("form-control", "name")}
                id="adminMemberName"
                name="name"
                value={memberFormData.name}
                onChange={handleMemberChange}
                required
              />
              {memberErrors.name && <div className="invalid-feedback">{memberErrors.name}</div>}
            </div>

            <div className="col-md-6">
              <label htmlFor="adminMemberEmail" className="form-label">Email *</label>
              <input
                type="email"
                className={getMemberControlClass("form-control", "email")}
                id="adminMemberEmail"
                name="email"
                value={memberFormData.email}
                onChange={handleMemberChange}
                required
              />
              {memberErrors.email && <div className="invalid-feedback">{memberErrors.email}</div>}
            </div>

            <div className="col-md-4">
              <label htmlFor="adminMemberYear" className="form-label">Year / Age (Optional)</label>
              <input
                type="number"
                className={getMemberControlClass("form-control", "year")}
                id="adminMemberYear"
                name="year"
                value={memberFormData.year}
                onChange={handleMemberChange}
              />
              {memberErrors.year && <div className="invalid-feedback">{memberErrors.year}</div>}
            </div>

            <div className="col-md-4">
              <label htmlFor="adminMemberAffiliation" className="form-label">Institution / Organization (Optional)</label>
              <input
                type="text"
                className="form-control"
                id="adminMemberAffiliation"
                name="affiliation"
                value={memberFormData.affiliation}
                onChange={handleMemberChange}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="adminMemberPhone" className="form-label">Phone (Optional)</label>
              <input
                type="text"
                className="form-control"
                id="adminMemberPhone"
                name="phone"
                value={memberFormData.phone}
                onChange={handleMemberChange}
              />
            </div>
          </div>

          <div className="mt-4">
            <button className="btn btn-success" type="submit">{memberSubmitLabel}</button>
            <button className="btn btn-secondary ms-2" type="button" onClick={clearMemberForm}>Clear</button>
            <button className="btn btn-outline-primary ms-2" type="button" onClick={loadMembers}>Reload Members</button>
          </div>

          {memberMessage.text && (
            <div className={"alert alert-" + memberMessage.type + " mt-3"} role="alert">
              {memberMessage.text}
            </div>
          )}
        </form>

        <h4 className="mb-3">Registered Members</h4>
        {renderMembers()}
      </section>
    </div>
  );
}
