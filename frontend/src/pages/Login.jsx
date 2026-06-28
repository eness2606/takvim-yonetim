import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
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
        <div style={{ maxWidth: 400, margin: '100px auto' }}>
            <h2>Giriş Yap</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
                />
                <input
                    type="password"
                    placeholder="Şifre"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
                />
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" style={{ width: '100%', padding: 8 }}>Giriş</button>
            </form>
        </div>
    )
}