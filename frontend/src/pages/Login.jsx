import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const { login } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            const res = await api.post('/auth/login', { email, password })

            if (res.data.requires_otp) {
                navigate('/otp-verify', {
                    state: {
                        session_token: res.data.session_token,
                        otp_code: res.data.otp_code,
                        email
                    }
                })
                return
            }

            login(res.data.access_token, res.data.refresh_token, email, 'viewer')
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.detail || 'Giriş başarısız')
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>Giriş Yap</h2>
                <form onSubmit={handleSubmit}>
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
                    {error && <div className="message message-error">{error}</div>}
                    <button type="submit">Giriş</button>
                </form>
                <p className="auth-footer">
                    Hesabın yok mu? <Link to="/register">Kayıt ol</Link>
                </p>
            </div>
        </div>
    )
}
