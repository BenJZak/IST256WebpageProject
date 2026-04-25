import { useState } from 'react';
import { API_BASE_URL } from '../api/apiConfig';
import { saveUser } from '../auth/session';

const emptyForm = {
  username: '',
  password: ''
};

export default function LoginPage(props) {
  const [formData, setFormData] = useState(emptyForm);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });

    if (message.text) {
      setMessage({ text: '', type: '' });
    }
  }

  function getPayload() {
    return {
      username: formData.username.trim(),
      password: formData.password
    };
  }

  function getSubmitButtonText() {
    if (isSubmitting) {
      return 'Signing In...';
    }

    return 'Sign In';
  }

  function getSignedInName() {
    if (props.authUser && props.authUser.name) {
      return props.authUser.name;
    }

    if (props.authUser && props.authUser.username) {
      return props.authUser.username;
    }

    return 'your account';
  }

  function renderAlreadySignedIn() {
    return (
      <div className="login-page">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-5 col-md-8">
              <section className="login-panel text-center">
                <div className="login-panel-header">
                  <span className="status-kicker">Club Portal</span>
                  <h2 className="mb-2">Already Signed In</h2>
                  <p className="text-muted mb-0">You are signed in as {getSignedInName()}.</p>
                </div>

                <div className="d-flex justify-content-center gap-2 flex-wrap">
                  <a className="btn btn-primary" href="#home">Go Home</a>
                  <button className="btn btn-outline-dark" type="button" onClick={props.onLogout}>
                    Logout
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (formData.username.trim() === '' || formData.password === '') {
      setMessage({ text: 'Enter your username and password.', type: 'danger' });
      return;
    }

    setIsSubmitting(true);

    fetch(API_BASE_URL + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getPayload())
    })
      .then(function(res) {
        return res.json().then(function(data) {
          if (!res.ok) {
            throw new Error(data.message || 'Login failed.');
          }

          return data;
        });
      })
      .then(function(data) {
        saveUser(data.user);

        if (props.onLogin) {
          props.onLogin(data.user);
        }

        setMessage({ text: 'Welcome, ' + data.user.name + '.', type: 'success' });

        if (data.user.role === 'admin') {
          window.location.hash = 'admin';
        } else {
          window.location.hash = 'orders';
        }
      })
      .catch(function(error) {
        setMessage({ text: error.message || 'Login failed.', type: 'danger' });
      })
      .finally(function() {
        setIsSubmitting(false);
      });
  }

  if (props.authUser) {
    return renderAlreadySignedIn();
  }

  return (
    <div className="login-page">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-8">
            <section className="login-panel">
              <div className="login-panel-header">
                <span className="status-kicker">Club Portal</span>
                <h2 className="mb-2">Account Sign In</h2>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="loginUsername" className="form-label">Username</label>
                  <input
                    id="loginUsername"
                    name="username"
                    className="form-control form-control-lg"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="loginPassword" className="form-label">Password</label>
                  <input
                    id="loginPassword"
                    name="password"
                    type="password"
                    className="form-control form-control-lg"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="login-demo-note">
                  Demo account: <strong>admin</strong> / <strong>admin</strong>
                </div>

                {message.text && (
                  <div className={'alert alert-' + message.type + ' mt-4'} role="alert">
                    {message.text}
                  </div>
                )}

                <button className="btn btn-primary btn-lg w-100 mt-4" type="submit" disabled={isSubmitting}>
                  {getSubmitButtonText()}
                </button>

                <div className="login-create-row">
                  <span>Need an account</span>
                  <a href="#signup">Create one</a>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
