import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('viewer')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/auth/register', { username, email, password, role })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg).join(', '))
      } else {
        setError(detail || 'Kayıt başarısız')
      }
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Kayıt Ol</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <input
              type="text"
              placeholder="Kullanıcı adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              pattern="^(?=.*[A-Z])(?=.*\d).{8,}$"
              title="En az 8 karakter, bir büyük harf ve bir rakam içermeli"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? 'Gizle' : 'Göster'}
            </button>
          </div>
          <p className="field-hint">En az 8 karakter, bir büyük harf ve bir rakam içermeli.</p>
          <div className="field">
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
          </div>
          {error && <div className="message message-error">{error}</div>}
          {success && <div className="message message-success">Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...</div>}
          <button type="submit">Kayıt Ol</button>
        </form>
        <p className="auth-footer">
          Hesabın var mı? <Link to="/login">Giriş yap</Link>
        </p>
      </div>
    </div>
  )
}
