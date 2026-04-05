import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { register } = useAuth();
  const navigate = useNavigate();

  const getPasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;
    return strength;
  };

  const handlePasswordChange = (value) => {
    setForm(p => ({ ...p, password: value }));
    setPasswordStrength(getPasswordStrength(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('All fields required');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ['#FF6B6B', '#FFD700', '#00FF88', '#00D9FF'];
  const strengthText = ['Weak', 'Fair', 'Good', 'Strong'];

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
        background: 'radial-gradient(circle, rgba(0,255,136,0.1) 0%, rgba(0,255,136,0) 70%)',
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
          alignItems: 'flex-start'
        }}>
          {/* Left side - Info */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            marginTop: '40px'
          }}>
            <div>
              <div style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: '#00FF88',
                marginBottom: '16px',
                textShadow: '0 0 30px rgba(0,255,136,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '2.5rem' }}>✨</span> Start Now
              </div>
              <p style={{
                fontSize: '1.1rem',
                color: '#A0AEC0',
                lineHeight: '1.6',
                maxWidth: '300px'
              }}>
                Join thousands of businesses already simplifying their inventory management with InvenTrack.
              </p>
            </div>

            {/* Benefits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: '🚀', text: 'Get started in seconds' },
                { icon: '🔐', text: 'Your data stays secure' },
                { icon: '💬', text: '24/7 support included' }
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
            border: '1px solid rgba(0, 255, 136, 0.2)',
            borderRadius: '20px',
            padding: '48px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            animation: 'slideIn 0.6s ease forwards',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '8px'
            }}>Create Account</h2>
            <p style={{
              color: '#A0AEC0',
              marginBottom: '32px',
              fontSize: '0.95rem'
            }}>Join InvenTrack and take control of your inventory</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Full Name Input */}
              <div className="form-input" style={{ animationDelay: '0.1s' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#E0E7FF',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Full Name</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    position: 'absolute',
                    left: '16px',
                    fontSize: '1.1rem',
                    color: focusedField === 'name' ? '#00FF88' : '#4A5A6A',
                    transition: 'color 0.3s'
                  }}>👤</span>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 48px',
                      background: focusedField === 'name' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: focusedField === 'name' ? '2px solid #00FF88' : '2px solid rgba(0, 255, 136, 0.2)',
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

              {/* Email Input */}
              <div className="form-input" style={{ animationDelay: '0.2s' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#E0E7FF',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Email Address</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    position: 'absolute',
                    left: '16px',
                    fontSize: '1.1rem',
                    color: focusedField === 'email' ? '#00FF88' : '#4A5A6A',
                    transition: 'color 0.3s'
                  }}>✉️</span>
                  <input
                    type="email"
                    placeholder="john@company.com"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 48px',
                      background: focusedField === 'email' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: focusedField === 'email' ? '2px solid #00FF88' : '2px solid rgba(0, 255, 136, 0.2)',
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

              {/* Password Input with Strength Indicator */}
              <div className="form-input" style={{ animationDelay: '0.3s' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#E0E7FF',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    position: 'absolute',
                    left: '16px',
                    fontSize: '1.1rem',
                    color: focusedField === 'password' ? '#00FF88' : '#4A5A6A',
                    transition: 'color 0.3s'
                  }}>🔐</span>
                  <input
                    type="password"
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={e => handlePasswordChange(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 48px',
                      background: focusedField === 'password' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: focusedField === 'password' ? '2px solid #00FF88' : '2px solid rgba(0, 255, 136, 0.2)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                    required
                  />
                </div>
                {form.password && (
                  <div style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(passwordStrength / 4) * 100}%`,
                        background: strengthColors[passwordStrength - 1] || '#FF6B6B',
                        transition: 'all 0.3s ease',
                        borderRadius: '2px'
                      }} />
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      color: strengthColors[passwordStrength - 1] || '#FF6B6B',
                      fontWeight: '600',
                      minWidth: '40px'
                    }}>
                      {strengthText[passwordStrength - 1] || 'Weak'}
                    </span>
                  </div>
                )}
              </div>

              {/* Role Selection */}
              <div className="form-input" style={{ animationDelay: '0.4s' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#E0E7FF',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Your Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(0, 255, 136, 0.2)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <option value="staff" style={{ background: '#0F1419' }}>👤 Staff Member</option>
                  <option value="manager" style={{ background: '#0F1419' }}>👨‍💼 Manager</option>
                  <option value="admin" style={{ background: '#0F1419' }}>👑 Administrator</option>
                </select>
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '12px',
                  padding: '14px 24px',
                  background: loading ? 'rgba(0, 255, 136, 0.5)' : 'linear-gradient(135deg, #00FF88 0%, #00D9FF 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#000',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0, 255, 136, 0.3)',
                  opacity: loading ? 0.7 : 1,
                  transform: loading ? 'scale(0.98)' : 'scale(1)'
                }}
              >
                {loading ? '⏳ Creating account...' : '→ Create Account'}
              </button>

              <p style={{
                textAlign: 'center',
                color: '#A0AEC0',
                fontSize: '0.8rem',
                marginTop: '4px'
              }}>
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>

            {/* Switch to Login */}
            <div style={{
              marginTop: '24px',
              textAlign: 'center',
              color: '#A0AEC0',
              fontSize: '0.9rem'
            }}>
              Already have an account?{' '}
              <Link to="/login" style={{
                color: '#00FF88',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'color 0.3s',
                cursor: 'pointer'
              }}>Sign in →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
