import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api/apiConfig';
import { clearUser, getAuthHeaders } from '../auth/session';

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

function createCartSessionID() {
  const newID = 'cart-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
  localStorage.setItem('cartSessionID', newID);
  return newID;
}

function getCartSessionID() {
  const savedID = localStorage.getItem('cartSessionID');

  if (savedID) {
    return savedID;
  }

  return createCartSessionID();
}

function getStoredCustomerEmail() {
  return localStorage.getItem('customerEmail') || '';
}

export default function StorefrontPage(props) {
  const signedInUser = Boolean(props.authUser && props.authUser.token);
  const signedInMember = props.authUser && props.authUser.role === 'member';
  const signedInAdmin = props.authUser && props.authUser.role === 'admin';
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(getStoredCart);
  const [cartSessionID, setCartSessionID] = useState(getCartSessionID);
  const [hasLoadedServerCart, setHasLoadedServerCart] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [message, setMessage] = useState('');
  const [cartMessage, setCartMessage] = useState('');

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
        setMessage('Products could not be loaded right now. Please try again in a moment.');
      });
  }

  function loadServerCart() {
    if (!signedInMember) {
      setHasLoadedServerCart(false);
      setCartMessage('');
      return;
    }

    fetch(API_BASE_URL + '/shopping-cart/' + encodeURIComponent(cartSessionID), {
      headers: getAuthHeaders()
    })
      .then(function(res) {
        if (!res.ok) {
          const error = new Error('Request failed');
          error.status = res.status;
          throw error;
        }

        return res.json();
      })
      .then(function(data) {
        if (data.status === 'active' && Array.isArray(data.items) && data.items.length > 0) {
          setCart(data.items);
        }

        setHasLoadedServerCart(true);
        setCartMessage('');
      })
      .catch(function(error) {
        if (error.status === 401) {
          clearUser();
          window.location.hash = 'login';
          return;
        }

        setHasLoadedServerCart(false);
        setCartMessage('Your saved cart could not be loaded right now. You can keep shopping on this device.');
      });
  }

  function replaceCartSessionID() {
    const nextSessionID = createCartSessionID();
    setCartSessionID(nextSessionID);
    return nextSessionID;
  }

  function syncCart(nextCart) {
    syncCartWithSession(nextCart, cartSessionID, false);
  }

  function syncCartWithSession(nextCart, sessionID, hasRetried) {
    if (!signedInMember || sessionID === '') {
      return;
    }

    fetch(API_BASE_URL + '/shopping-cart/' + encodeURIComponent(sessionID), {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        shopperEmail: props.authUser.email || getStoredCustomerEmail(),
        items: nextCart,
        status: 'active'
      })
    })
      .then(function(res) {
        if (!res.ok) {
          const error = new Error('Request failed');
          error.status = res.status;
          throw error;
        }

        return res.json();
      })
      .then(function() {
        setCartMessage('');
      })
      .catch(function(error) {
        if (error.status === 401) {
          clearUser();
          window.location.hash = 'login';
          return;
        }

        if (error.status === 403 && !hasRetried) {
          const nextSessionID = replaceCartSessionID();
          syncCartWithSession(nextCart, nextSessionID, true);
          return;
        }

        setCartMessage('Your cart is saved on this device. It could not be backed up online right now.');
      });
  }

  useEffect(function() {
    if (!signedInUser) {
      setProducts([]);
      setMessage('');
      setCartMessage('');
      setHasLoadedServerCart(false);
      return;
    }

    loadProducts();

    if (signedInMember) {
      loadServerCart();
    } else {
      setCart([]);
      setCartMessage('');
      setHasLoadedServerCart(false);
    }
  }, [props.authUser]);

  useEffect(function() {
    if (signedInMember) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }

    if (hasLoadedServerCart && signedInMember) {
      syncCart(cart);
    }
  }, [cart, hasLoadedServerCart, props.authUser]);

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
    if (!signedInMember) {
      return;
    }

    const product = products.find(function(item) {
      return item.productID === productID;
    });

    if (product) {
      setCart(cart.concat([product]));
    }
  }

  function handleRemoveFromCart(index) {
    if (!signedInMember) {
      return;
    }

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
            <div className="d-flex justify-content-between gap-2 align-items-start">
              <h5 className="card-title">{product.description || 'Untitled Product'}</h5>
              <span className="badge text-bg-light">{product.productID}</span>
            </div>
            <p><strong>Category:</strong> {product.category}</p>
            <p><strong>Unit:</strong> {product.unit}</p>
            <p><strong>Price:</strong> ${Number(product.price || 0).toFixed(2)}</p>
            <p><strong>Weight:</strong> {product.weight || 'N/A'}</p>
            <p><strong>Color:</strong> {product.color || 'N/A'}</p>
            {renderProductAction(product)}
          </div>
        </div>
      );
    });
  }

  function renderProductAction(product) {
    if (!signedInMember) {
      return null;
    }

    return (
      <button
        className="btn btn-sm btn-primary"
        type="button"
        onClick={function() { handleAddToCart(product.productID); }}
      >
        Send to Cart
      </button>
    );
  }

  function renderCartItems() {
    if (cart.length === 0) {
      return <div className="alert alert-secondary">Cart is empty</div>;
    }

    return cart.map(function(item, index) {
      return (
        <div className="card mb-2 shadow-sm" key={(item.productID || 'item') + '-' + index}>
          <div className="card-body">
            <div className="fw-semibold">{item.description || 'Untitled Product'}</div>
            <div className="text-muted">{item.productID} - ${Number(item.price || 0).toFixed(2)}</div>
            <button
              className="btn btn-sm btn-danger mt-2"
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

    if (!signedInMember) {
      return (
        <div className="alert alert-info mt-3 mb-0">
          <div className="mb-2">Please create an account or log in before checkout.</div>
          <a className="btn btn-primary btn-sm" href="#login">Login / Sign Up</a>
        </div>
      );
    }

    return (
      <a className="btn btn-primary mt-3" href="#checkout">
        Go to Checkout
      </a>
    );
  }

  function renderCartPanel() {
    if (signedInAdmin) {
      return (
        <div className="product-form">
          <h4>Admin Store View</h4>
          <p className="text-muted">You can review the customer store here. Product edits are handled from Admin Review.</p>
          <a className="btn btn-outline-primary" href="#admin">Open Product Management</a>
        </div>
      );
    }

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center gap-2">
          <h4>Shopping Cart</h4>
          <span className="badge text-bg-light">{cart.length} item(s)</span>
        </div>
        {renderCartItems()}

        {renderCheckoutButton()}
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
              <p className="mb-4">Please create an account or log in before viewing the store.</p>
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

  if (!signedInUser) {
    return renderLoginRequired();
  }

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
        <div>
          <h2 className="mb-1">Store</h2>
          <p className="text-muted mb-0">Browse product details and add items to your shopping cart.</p>
        </div>

        <button className="btn btn-outline-primary" type="button" onClick={loadProducts}>
          Reload Products
        </button>
      </div>

      {message && <div className="alert alert-danger">{message}</div>}
      {cartMessage && <div className="alert alert-warning">{cartMessage}</div>}
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
          <h4>Product Details</h4>
          {renderFilteredProducts()}
        </div>

        <div className="col-lg-5 mb-4">
          {renderCartPanel()}
        </div>
      </div>
    </div>
  );
}
