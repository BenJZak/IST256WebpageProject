import { useState } from 'react';
import { API_BASE_URL } from '../api/apiConfig';
import { defaultSignUp } from '../data/defaultData';
import { saveUser } from '../auth/session';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export default function SignUpPage() {
  const [formData, setFormData] = useState(defaultSignUp);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  function handleChange(event) {
    const { name, value } = event.target;
    const nextFormData = Object.assign({}, formData);
    nextFormData[name] = value;
    setFormData(nextFormData);

    if (message.text) {
      setMessage({ text: '', type: '' });
    }

    if (errors[name]) {
      const nextErrors = Object.assign({}, errors);
      delete nextErrors[name];
      setErrors(nextErrors);
    }
  }

  function getErrors() {
    const nextErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (formData.name.trim() === '') {
      nextErrors.name = 'Enter your name.';
    }

    if (formData.email.trim() === '') {
      nextErrors.email = 'Enter your email address.';
    } else if (!emailPattern.test(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (formData.username.trim() === '') {
      nextErrors.username = 'Choose a username.';
    } else if (!/^[a-z0-9_.-]{3,30}$/.test(formData.username.trim().toLowerCase())) {
      nextErrors.username = 'Use 3 to 30 letters, numbers, dots, dashes, or underscores.';
    }

    if (formData.password === '') {
      nextErrors.password = 'Choose a password.';
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (formData.confirmPassword !== formData.password) {
      nextErrors.confirmPassword = 'Passwords must match.';
    }

    if (formData.year.trim() !== '' && Number(formData.year) <= 0) {
      nextErrors.year = 'Year or age must be greater than 0.';
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
      setMessage({ text: 'Please fix the highlighted sign-up fields.', type: 'danger' });
      return;
    }

    const shopperPayload = {
      name: formData.name.trim(),
      email: normalizeEmail(formData.email),
      username: formData.username.trim().toLowerCase(),
      password: formData.password,
      year: formData.year.trim(),
      affiliation: formData.affiliation.trim(),
      phone: formData.phone.trim()
    };

    fetch(API_BASE_URL + '/shoppers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shopperPayload)
    })
      .then(function(res) {
        return res.json().then(function(data) {
          if (!res.ok) {
            throw new Error(data.message || 'Sign up could not be saved.');
          }

          return data;
        });
      })
      .then(function(data) {
        const shopper = data.shopper || data;
        const user = data.user || {
          role: 'member',
          id: shopper.id,
          name: shopper.name,
          email: shopper.email,
          username: shopper.username,
          phone: shopper.phone,
          year: shopper.year,
          affiliation: shopper.affiliation
        };

        localStorage.setItem('customerEmail', shopper.email);
        saveUser(user);
        setFormData(defaultSignUp);
        setErrors({});
        setMessage({ text: '', type: '' });
        window.location.hash = 'home';
      })
      .catch(function(error) {
        setMessage({ text: error.message || 'Sign up could not be saved.', type: 'danger' });
      });
  }

  return (
    <div className="login-page">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-xl-7 col-lg-8 col-md-10">
            <section className="login-panel signup-panel">
              <div className="login-panel-header">
                <span className="status-kicker">Club Portal</span>
                <h2 className="mb-2">Create Profile</h2>
                <p className="text-muted mb-0">Create one account for checkout, orders, and returns.</p>
              </div>

              {message.text && (
                <div className={'alert alert-' + message.type} role="alert">
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="signupName" className="form-label">Name *</label>
                    <input id="signupName" name="name" className={getControlClass('form-control form-control-lg', 'name')} value={formData.name} onChange={handleChange} />
                    {renderError('name')}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="signupEmail" className="form-label">Email *</label>
                    <input id="signupEmail" name="email" type="email" className={getControlClass('form-control form-control-lg', 'email')} value={formData.email} onChange={handleChange} />
                    {renderError('email')}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="signupUsername" className="form-label">Username *</label>
                    <input id="signupUsername" name="username" className={getControlClass('form-control form-control-lg', 'username')} autoComplete="username" value={formData.username} onChange={handleChange} />
                    {renderError('username')}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="signupYear" className="form-label">Year / Age</label>
                    <input id="signupYear" name="year" type="number" className={getControlClass('form-control form-control-lg', 'year')} value={formData.year} onChange={handleChange} />
                    {renderError('year')}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="signupPassword" className="form-label">Password *</label>
                    <input id="signupPassword" name="password" type="password" className={getControlClass('form-control form-control-lg', 'password')} autoComplete="new-password" value={formData.password} onChange={handleChange} />
                    {renderError('password')}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="signupConfirmPassword" className="form-label">Confirm Password *</label>
                    <input id="signupConfirmPassword" name="confirmPassword" type="password" className={getControlClass('form-control form-control-lg', 'confirmPassword')} autoComplete="new-password" value={formData.confirmPassword} onChange={handleChange} />
                    {renderError('confirmPassword')}
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="signupAffiliation" className="form-label">Institution / Organization</label>
                    <input id="signupAffiliation" name="affiliation" className="form-control form-control-lg" value={formData.affiliation} onChange={handleChange} />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="signupPhone" className="form-label">Phone</label>
                    <input id="signupPhone" name="phone" className="form-control form-control-lg" value={formData.phone} onChange={handleChange} />
                  </div>
                </div>

                <button className="btn btn-primary btn-lg w-100 mt-4" type="submit">Create Profile</button>

                <div className="login-create-row">
                  <span>Already have an account</span>
                  <a href="#login">Sign in</a>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
