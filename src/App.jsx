import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MembersPage from './pages/MembersPage';
import StorefrontPage from './pages/StorefrontPage';
import FinalizationPage from './pages/FinalizationPage';

export default function App() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light-subtle">
      <Header />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/storefront" element={<StorefrontPage />} />
          <Route path="/finalization" element={<FinalizationPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

