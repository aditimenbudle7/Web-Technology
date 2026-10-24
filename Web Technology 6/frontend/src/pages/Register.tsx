import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const initial: FormState = { fullName: '', email: '', phone: '', password: '', confirmPassword: '' };

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (f.fullName.trim().length < 3) e.fullName = 'Name must be at least 3 characters';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address';
  if (f.phone && !/^\d{10}$/.test(f.phone)) e.phone = 'Phone must be 10 digits';
  if (f.password.length < 6) e.password = 'Password must be at least 6 characters';
  if (f.confirmPassword !== f.password) e.confirmPassword = 'Passwords do not match';
  return e;
}

export default function Register() {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;

    setLoading(true);
    try {
      const { confirmPassword: _c, ...payload } = form;
      const res = await api.register(payload);
      login(res.user, res.token);
      navigate('/catalogue');
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const field = (name: keyof FormState, label: string, type = 'text', placeholder = '') => (
    <label className="field">
      <span>{label}</span>
      <input className={`input ${errors[name] ? 'invalid' : ''}`} name={name} type={type}
        value={form[name]} onChange={onChange} placeholder={placeholder} />
      {errors[name] && <small className="field-error">{errors[name]}</small>}
    </label>
  );

  return (
    <section className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Create your account</h1>
        <p className="muted">Join PageTurner and start reading</p>

        {serverError && <p className="alert alert-error">{serverError}</p>}

        {field('fullName', 'Full Name', 'text', 'Your name')}
        {field('email', 'Email', 'email', 'you@example.com')}
        {field('phone', 'Phone (optional)', 'tel', '10-digit number')}
        <div className="field-row">
          {field('password', 'Password', 'password', 'Min. 6 characters')}
          {field('confirmPassword', 'Confirm Password', 'password', 'Re-enter password')}
        </div>

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Register'}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </section>
  );
}
