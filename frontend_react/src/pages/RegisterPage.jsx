import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { Hexagon } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      await authApi.register({ username: formData.username, email: formData.email, password: formData.password });
      const res = await authApi.login({ username: formData.username, password: formData.password });
      await login(res.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form glass-panel">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--accent-teal)' }}>
          <Hexagon size={48} />
        </div>
        <h1 className="auth-title">Create Account</h1>
        
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label className="input-label">Username</label>
            <input type="text" name="username" className="input-field" value={formData.username} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input type="email" name="email" className="input-field" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input type="password" name="password" className="input-field" value={formData.password} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <input type="password" name="confirmPassword" className="input-field" value={formData.confirmPassword} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '12px' }}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <Link to="/login" className="auth-link">Already have an account? Login</Link>
      </div>
    </div>
  );
};

export default RegisterPage;
