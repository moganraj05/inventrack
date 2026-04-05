import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('All fields required');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F1419 0%, #1a2332 50%, #0d3b66 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(0,217,255,0.1) 0%, rgba(0,217,255,0) 70%)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(157,78,221,0.1) 0%, rgba(157,78,221,0) 70%)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite'
      }} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(30px); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .form-input {
          animation: slideIn 0.5s ease forwards;
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1000px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          alignItems: 'center'
        }}>
          {/* Left side - Info */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <div>
              <div style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: '#00D9FF',
                marginBottom: '16px',
                textShadow: '0 0 30px rgba(0,217,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '2.5rem' }}>▣</span> InvenTrack
              </div>
              <p style={{
                fontSize: '1.1rem',
                color: '#A0AEC0',
                lineHeight: '1.6',
                maxWidth: '300px'
              }}>
                Manage your inventory with precision and ease. Real-time tracking, analytics, and more.
              </p>
            </div>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: '⚡', text: 'Lightning fast performance' },
                { icon: '🔒', text: 'Enterprise-grade security' },
                { icon: '📊', text: 'Real-time analytics' }
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#E0E7FF'
                }}>
                  <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Form */}
          <div style={{
            background: 'rgba(15, 20, 25, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 217, 255, 0.2)',
            borderRadius: '20px',
            padding: '48px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            animation: 'slideIn 0.6s ease forwards'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '8px'
            }}>Welcome Back</h2>
            <p style={{
              color: '#A0AEC0',
              marginBottom: '32px',
              fontSize: '0.95rem'
            }}>Sign in to continue to your dashboard</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Email Input */}
              <div className="form-input" style={{ animationDelay: '0.1s' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#E0E7FF',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Email Address</label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: '16px',
                    fontSize: '1.1rem',
                    color: focusedField === 'email' ? '#00D9FF' : '#4A5A6A',
                    transition: 'color 0.3s'
                  }}>✉️</span>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 48px',
                      background: focusedField === 'email' ? 'rgba(0, 217, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: focusedField === 'email' ? '2px solid #00D9FF' : '2px solid rgba(0, 217, 255, 0.2)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="form-input" style={{ animationDelay: '0.2s' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#E0E7FF',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Password</label>
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: '16px',
                    fontSize: '1.1rem',
                    color: focusedField === 'password' ? '#00D9FF' : '#4A5A6A',
                    transition: 'color 0.3s'
                  }}>🔐</span>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 48px',
                      background: focusedField === 'password' ? 'rgba(0, 217, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: focusedField === 'password' ? '2px solid #00D9FF' : '2px solid rgba(0, 217, 255, 0.2)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '12px',
                  padding: '14px 24px',
                  background: loading ? 'rgba(0, 217, 255, 0.5)' : 'linear-gradient(135deg, #00D9FF 0%, #00FF88 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0, 217, 255, 0.3)',
                  opacity: loading ? 0.7 : 1,
                  transform: loading ? 'scale(0.98)' : 'scale(1)'
                }}
              >
                {loading ? '⏳ Signing in...' : '→ Sign In'}
              </button>
            </form>

            {/* Switch to Register */}
            <div style={{
              marginTop: '24px',
              textAlign: 'center',
              color: '#A0AEC0',
              fontSize: '0.9rem'
            }}>
              Don't have an account?{' '}
              <Link to="/register" style={{
                color: '#00D9FF',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'color 0.3s',
                cursor: 'pointer'
              }}>Create one →</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Demo credentials hint */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 217, 255, 0.1)',
        border: '1px solid rgba(0, 217, 255, 0.3)',
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '0.8rem',
        color: '#A0AEC0',
        maxWidth: '250px',
        backdropFilter: 'blur(10px)'
      }}>
        <strong style={{ color: '#00D9FF' }}>Demo:</strong> admin@inventrack.com / admin123
      </div>
    </div>
  );
}
