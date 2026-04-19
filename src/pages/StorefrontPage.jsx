import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api/apiConfig';
function getStoredCart() {
  const savedCart = localStorage.getItem('cart');

  if (savedCart) {
    return JSON.parse(savedCart);
  }

  return [];
}

export default function StorefrontPage(props) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(getStoredCart);
  const [searchValue, setSearchValue] = useState('');
  const [message, setMessage] = useState('');

  function loadProducts() {
    fetch(API_BASE_URL + '/products')
      .then(function(res) {
        if (!res.ok) {
          throw new Error('Request failed');
        }

        return res.json();
      })
      .then(function(data) {
        setProducts(data);
        setCart(function(currentCart) {
          return currentCart.filter(function(item) {
            return data.some(function(product) {
              return product.productID === item.productID;
            });
          });
        });
        setMessage('');
      })
      .catch(function() {
        setProducts([]);
        setMessage('Products could not be loaded. Make sure the Node.js server is running.');
      });
  }

  useEffect(loadProducts, []);

  useEffect(function() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  function getFilteredProducts() {
    const value = searchValue.toLowerCase();

    return products.filter(function(product) {
      return (
        (product.description || '').toLowerCase().includes(value) ||
        (product.category || '').toLowerCase().includes(value) ||
        (product.productID || '').toLowerCase().includes(value) ||
        (product.unit || '').toLowerCase().includes(value) ||
        (product.color || '').toLowerCase().includes(value) ||
        (product.weight || '').toLowerCase().includes(value)
      );
    });
  }

  function handleAddToCart(productID) {
    const product = products.find(function(item) {
      return item.productID === productID;
    });

    if (product) {
      setCart(cart.concat([product]));
    }
  }

  function handleRemoveFromCart(index) {
    setCart(cart.filter(function(item, currentIndex) {
      return currentIndex !== index;
    }));
  }

  function handleSearchChange(event) {
    setSearchValue(event.target.value);
  }

  function renderFilteredProducts() {
    const filteredProducts = getFilteredProducts();

    if (products.length === 0) {
      return <div className="alert alert-info">No products are available right now.</div>;
    }

    if (filteredProducts.length === 0) {
      return <div className="alert alert-warning">No matching products found.</div>;
    }

    return filteredProducts.map(function(product) {
      return (
        <div className="card mb-3 shadow-sm" key={product.productID}>
          <div className="card-body">
            <h5 className="card-title">{product.description || 'Untitled Product'}</h5>
            <p><strong>ID:</strong> {product.productID}</p>
            <p><strong>Category:</strong> {product.category}</p>
            <p><strong>Unit:</strong> {product.unit}</p>
            <p><strong>Price:</strong> ${Number(product.price || 0).toFixed(2)}</p>
            <p><strong>Weight:</strong> {product.weight || 'N/A'}</p>
            <p><strong>Color:</strong> {product.color || 'N/A'}</p>
            <button
              className="btn btn-sm btn-primary"
              type="button"
              onClick={function() { handleAddToCart(product.productID); }}
            >
              Send to Cart
            </button>
          </div>
        </div>
      );
    });
  }

  function renderCartItems() {
    if (cart.length === 0) {
      return <div className="alert alert-secondary">Cart is empty</div>;
    }

    return cart.map(function(item, index) {
      return (
        <div className="card mb-2 shadow-sm" key={(item.productID || 'item') + '-' + index}>
          <div className="card-body">
            {item.description || 'Untitled Product'} - ${Number(item.price || 0).toFixed(2)}
            <button
              className="btn btn-sm btn-danger float-end"
              type="button"
              onClick={function() { handleRemoveFromCart(index); }}
            >
              Remove
            </button>
          </div>
        </div>
      );
    });
  }

  function renderCheckoutButton() {
    if (cart.length === 0) {
      return (
        <button className="btn btn-primary mt-3" type="button" disabled>
          Add Items Before Checkout
        </button>
      );
    }

    return (
      <a className="btn btn-primary mt-3" href="#checkout">
        Go to Checkout
      </a>
    );
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
        <div>
          <h2 className="mb-1">Store</h2>
          <p className="text-muted mb-0">Browse available products and send items to your cart.</p>
        </div>

        <button className="btn btn-outline-primary" type="button" onClick={loadProducts}>
          Reload Products
        </button>
      </div>

      {message && <div className="alert alert-danger">{message}</div>}
      {props.checkoutNotice && cart.length === 0 && <div className="alert alert-warning">{props.checkoutNotice}</div>}

      <div className="row mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search products..."
            value={searchValue}
            onChange={handleSearchChange}
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

          {renderCheckoutButton()}
        </div>
      </div>
    </div>
  );
}
