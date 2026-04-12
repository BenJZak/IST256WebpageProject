import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { defaultProducts } from '../data/defaultData';

function getStoredProducts() {
  const savedProducts = localStorage.getItem('products');

  if (savedProducts) {
    return JSON.parse(savedProducts);
  }

  return defaultProducts;
}

function getStoredCart() {
  const savedCart = localStorage.getItem('cart');

  if (savedCart) {
    return JSON.parse(savedCart);
  }

  return [];
}

function generateProductID(products) {
  if (products.length === 0) {
    return 'P1';
  }

  let highestNum = 0;

  products.forEach((product) => {
    const currentNum = parseInt(product.productID.replace('P', ''), 10);
    if (currentNum > highestNum) {
      highestNum = currentNum;
    }
  });

  return `P${highestNum + 1}`;
}

export default function StorefrontPage() {
  const [products, setProducts] = useState(getStoredProducts);
  const [cart, setCart] = useState(getStoredCart);
  const [searchValue, setSearchValue] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState({ text: '', type: '' });
  const [formData, setFormData] = useState({
    productID: generateProductID(getStoredProducts()),
    description: '',
    price: '',
    category: '',
    unit: '',
    weight: '',
    color: ''
  });

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const filteredProducts = useMemo(() => {
    const value = searchValue.toLowerCase();

    return products.filter((product) => {
      return (
        product.description.toLowerCase().includes(value) ||
        product.category.toLowerCase().includes(value) ||
        product.productID.toLowerCase().includes(value) ||
        product.unit.toLowerCase().includes(value) ||
        (product.color && product.color.toLowerCase().includes(value)) ||
        (product.weight && product.weight.toLowerCase().includes(value))
      );
    });
  }, [products, searchValue]);

  function resetForm(nextProducts) {
    setFormData({
      productID: generateProductID(nextProducts),
      description: '',
      price: '',
      category: '',
      unit: '',
      weight: '',
      color: ''
    });
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (
      formData.description.trim() === '' ||
      formData.price === '' ||
      formData.category === '' ||
      formData.unit === ''
    ) {
      setCheckoutMessage({ text: 'Please complete all required product fields.', type: 'danger' });
      return;
    }

    const newProduct = {
      productID: formData.productID,
      description: formData.description.trim(),
      category: formData.category,
      unit: formData.unit,
      price: Number(formData.price),
      weight: formData.weight.trim(),
      color: formData.color.trim()
    };

    const nextProducts = [...products, newProduct];
    setProducts(nextProducts);
    resetForm(nextProducts);
    setCheckoutMessage({ text: '', type: '' });
  }

  function handleAddToCart(productID) {
    const product = products.find((item) => item.productID === productID);
    if (product) {
      setCart([...cart, product]);
    }
  }

  function handleRemoveFromCart(index) {
    setCart(cart.filter((_, currentIndex) => currentIndex !== index));
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      setCheckoutMessage({ text: 'Your cart is empty.', type: 'danger' });
      return;
    }

    const cartTotal = cart.reduce((total, item) => total + Number(item.price), 0);
    const orderDocument = {
      customer: {
        fullName: 'Storefront Customer',
        email: 'Not provided'
      },
      options: {
        pickupMethod: 'Not selected',
        paymentMethod: 'Not selected',
        notes: 'Submitted from the storefront AJAX button.'
      },
      cart,
      total: Number(cartTotal.toFixed(2))
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderDocument)
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      await response.json();
      setCheckoutMessage({ text: 'Cart sent to the Node.js backend with pending status!', type: 'success' });
    } catch (error) {
      setCheckoutMessage({ text: 'Error sending cart. Please try again.', type: 'danger' });
    }
  }

  function renderFilteredProducts() {
    if (filteredProducts.length === 0) {
      return <div className="alert alert-warning">No matching products found.</div>;
    }

    return filteredProducts.map((product) => (
      <div className="card mb-3 shadow-sm" key={product.productID}>
        <div className="card-body">
          <h5 className="card-title">{product.description}</h5>
          <p><strong>ID:</strong> {product.productID}</p>
          <p><strong>Category:</strong> {product.category}</p>
          <p><strong>Unit:</strong> {product.unit}</p>
          <p><strong>Price:</strong> ${product.price.toFixed(2)}</p>
          <p><strong>Weight:</strong> {product.weight || 'N/A'}</p>
          <p><strong>Color:</strong> {product.color || 'N/A'}</p>
          <button className="btn btn-sm btn-primary" type="button" onClick={() => handleAddToCart(product.productID)}>
            Add to Cart
          </button>
        </div>
      </div>
    ));
  }

  function renderCartItems() {
    if (cart.length === 0) {
      return <div className="alert alert-secondary">Cart is empty</div>;
    }

    return cart.map((item, index) => (
      <div className="card mb-2 shadow-sm" key={`${item.productID}-${index}`}>
        <div className="card-body">
          {item.description} - ${item.price.toFixed(2)}
          <button className="btn btn-sm btn-danger float-end" type="button" onClick={() => handleRemoveFromCart(index)}>
            Remove
          </button>
        </div>
      </div>
    ));
  }

  return (
    <div className="container py-5">
      <h2 className="mb-4">Shopping Cart Web Page</h2>

      <form onSubmit={handleSubmit} className="product-form mb-5">
        <div className="row g-3">
          <div className="col-md-4">
            <label htmlFor="productID" className="form-label">Product ID *</label>
            <input type="text" className="form-control" id="productID" name="productID" value={formData.productID} readOnly />
          </div>

          <div className="col-md-4">
            <label htmlFor="description" className="form-label">Description *</label>
            <input type="text" className="form-control" id="description" name="description" value={formData.description} onChange={handleChange} />
          </div>

          <div className="col-md-4">
            <label htmlFor="price" className="form-label">Price *</label>
            <input type="number" step="0.01" min="0.01" className="form-control" id="price" name="price" value={formData.price} onChange={handleChange} />
          </div>

          <div className="col-md-4">
            <label htmlFor="category" className="form-label">Category *</label>
            <select className="form-select" id="category" name="category" value={formData.category} onChange={handleChange}>
              <option value="">Select Category</option>
              <option value="Apparel">Apparel</option>
              <option value="Event">Event</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>

          <div className="col-md-4">
            <label htmlFor="unit" className="form-label">Unit *</label>
            <select className="form-select" id="unit" name="unit" value={formData.unit} onChange={handleChange}>
              <option value="">Select Unit</option>
              <option value="Each">Each</option>
              <option value="Ticket">Ticket</option>
            </select>
          </div>

          <div className="col-md-4">
            <label htmlFor="weight" className="form-label">Weight</label>
            <input type="text" className="form-control" id="weight" name="weight" placeholder="e.g. 1 lb" value={formData.weight} onChange={handleChange} />
          </div>

          <div className="col-md-4">
            <label htmlFor="color" className="form-label">Color</label>
            <input type="text" className="form-control" id="color" name="color" placeholder="e.g. Navy" value={formData.color} onChange={handleChange} />
          </div>
        </div>

        <div className="mt-4">
          <button type="submit" className="btn btn-success">Add Product</button>
          <button type="button" className="btn btn-secondary ms-2" onClick={() => resetForm(products)}>Clear</button>
        </div>
      </form>

      <hr className="my-5" />

      <div className="row mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search products..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
        </div>
      </div>

      <div className="row">
        <div className="col-lg-7 mb-4">
          <h4>Available Products</h4>
          {renderFilteredProducts()}
        </div>

        <div className="col-lg-5 mb-4">
          <h4>Shopping Cart</h4>
          {renderCartItems()}

          {checkoutMessage.text && (
            <div className={`alert alert-${checkoutMessage.type} mt-3`} role="alert">
              {checkoutMessage.text}
            </div>
          )}

          <button className="btn btn-primary mt-3" type="button" onClick={handleCheckout}>
            Send Cart with AJAX
          </button>

          <div className="mt-3">
            <Link to="/finalization" className="btn btn-outline-dark">
              Continue to Finalization Page
            </Link>
          </div>
        </div>
      </div>

      <hr className="my-5" />

      <h4>JSON Product Data</h4>
      <pre id="jsonOutput" className="bg-white p-3 border rounded">{JSON.stringify(products, null, 2)}</pre>
    </div>
  );
}
