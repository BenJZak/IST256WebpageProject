import { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import StorefrontPage from './pages/StorefrontPage';
import FinalizationPage from './pages/FinalizationPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import AdminPage from './pages/AdminPage';
import SignUpPage from './pages/SignUpPage';
import ReturnsPage from './pages/ReturnsPage';
import LoginPage from './pages/LoginPage';
import { clearUser, getStoredUser } from './auth/session';

const emptyCartCheckoutMessage = 'Add at least one product to the cart before going to checkout.';

function getStoredCartItems() {
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

function cartHasItems() {
  return getStoredCartItems().length > 0;
}

function getPageFromLocation() {
  const hashValue = window.location.hash.replace('#', '').toLowerCase();
  const pathName = window.location.pathname.toLowerCase();

  if (hashValue === 'store' || pathName === '/storefront') {
    return 'store';
  }

  if (hashValue === 'signup' || pathName === '/signup') {
    return 'signup';
  }

  if (hashValue === 'login' || pathName === '/login') {
    return 'login';
  }

  if (hashValue === 'checkout' || pathName === '/finalization') {
    return 'checkout';
  }

  if (hashValue === 'orders' || pathName === '/orders') {
    return 'orders';
  }

  if (hashValue === 'returns' || pathName === '/returns') {
    return 'returns';
  }

  if (
    hashValue === 'admin' ||
    hashValue === 'admin-review' ||
    hashValue === 'admin-history' ||
    hashValue === 'admin-members' ||
    hashValue === 'admin-products' ||
    hashValue === 'admin-returns' ||
    pathName === '/admin' ||
    pathName === '/approval' ||
    pathName === '/members'
  ) {
    return 'admin';
  }

  return 'home';
}

function getStartingPage() {
  const pageName = getPageFromLocation();

  if (pageName === 'checkout' && !cartHasItems()) {
    return 'store';
  }

  return pageName;
}

function getStartingCheckoutNotice() {
  if (getPageFromLocation() === 'checkout' && !cartHasItems()) {
    return emptyCartCheckoutMessage;
  }

  return '';
}

function getSectionID() {
  const hashValue = window.location.hash.replace('#', '').toLowerCase();

  if (hashValue === 'admin-review') {
    return 'review';
  }

  if (hashValue === 'admin-history') {
    return 'history';
  }

  if (hashValue === 'admin-members') {
    return 'members';
  }

  if (hashValue === 'admin-products') {
    return 'products';
  }

  if (hashValue === 'admin-returns') {
    return 'returns';
  }

  return '';
}

function updateOldUrl() {
  const pathName = window.location.pathname.toLowerCase();

  if (pathName === '/storefront') {
    window.history.replaceState(null, '', '/#store');
  } else if (pathName === '/signup') {
    window.history.replaceState(null, '', '/#signup');
  } else if (pathName === '/login') {
    window.history.replaceState(null, '', '/#login');
  } else if (pathName === '/finalization') {
    window.history.replaceState(null, '', '/#checkout');
  } else if (pathName === '/orders') {
    window.history.replaceState(null, '', '/#orders');
  } else if (pathName === '/returns') {
    window.history.replaceState(null, '', '/#returns');
  } else if (pathName === '/approval') {
    window.history.replaceState(null, '', '/#admin-review');
  } else if (pathName === '/members') {
    window.history.replaceState(null, '', '/#admin-members');
  } else if (pathName === '/admin') {
    window.history.replaceState(null, '', '/#admin');
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(getStartingPage);
  const [checkoutNotice, setCheckoutNotice] = useState(getStartingCheckoutNotice);
  const [authUser, setAuthUser] = useState(getStoredUser);

  function handleLogin(user) {
    setAuthUser(user);
  }

  function handleLogout() {
    clearUser();
    setAuthUser(null);
    window.location.hash = 'home';
  }

  function renderCurrentPage() {
    if (currentPage === 'store') {
      return <StorefrontPage checkoutNotice={checkoutNotice} authUser={authUser} />;
    }

    if (currentPage === 'checkout') {
      return <FinalizationPage />;
    }

    if (currentPage === 'signup') {
      return <SignUpPage />;
    }

    if (currentPage === 'login') {
      return <LoginPage authUser={authUser} onLogin={handleLogin} onLogout={handleLogout} />;
    }

    if (currentPage === 'orders') {
      return <OrderHistoryPage authUser={authUser} />;
    }

    if (currentPage === 'returns') {
      return <ReturnsPage />;
    }

    if (currentPage === 'admin') {
      return <AdminPage authUser={authUser} />;
    }

    return <HomePage authUser={authUser} />;
  }

  useEffect(function() {
    function handleLocationChange() {
      updateOldUrl();
      const pageName = getPageFromLocation();

      if (pageName === 'checkout' && !cartHasItems()) {
        window.history.replaceState(null, '', '/#store');
        setCheckoutNotice(emptyCartCheckoutMessage);
        setCurrentPage('store');
        return;
      }

      setCheckoutNotice('');
      setCurrentPage(pageName);
    }

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);

    return function() {
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  useEffect(function() {
    function handleUserChange() {
      setAuthUser(getStoredUser());
    }

    window.addEventListener('portalUserChanged', handleUserChange);

    return function() {
      window.removeEventListener('portalUserChanged', handleUserChange);
    };
  }, []);

  useEffect(function() {
    const sectionID = getSectionID();

    if (sectionID !== '') {
      setTimeout(function() {
        const section = document.getElementById(sectionID);

        if (section) {
          section.scrollIntoView();
        }
      }, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [currentPage]);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light-subtle">
      <Header currentPage={currentPage} authUser={authUser} onLogout={handleLogout} />
      <main className="flex-grow-1">
        {renderCurrentPage()}
      </main>
      <Footer />
    </div>
  );
}
