import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function OtpVerify() {
    const [otpCode, setOtpCode] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const location = useLocation()
    const { login } = useAuth()

    const { session_token, otp_code, email } = location.state || {}

    if (!session_token) {
        navigate('/login')
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            const res = await api.post('/auth/verify-otp', {
                session_token,
                otp_code: otpCode
            })
            login(res.data.access_token, res.data.refresh_token, email, 'editor')
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.detail || 'OTP doğrulama başarısız')
        }
    }

    return (
        <div style={{ maxWidth: 400, margin: '100px auto' }}>
            <h2>OTP Doğrulama</h2>
            <div style={{ background: '#fff3cd', padding: 10, marginBottom: 15, borderRadius: 4 }}>
                <strong>Dev Mode:</strong> OTP kodunuz: <strong>{otp_code}</strong>
                <p style={{ fontSize: 12, margin: '5px 0 0' }}>Gerçek ortamda bu kod email ile gönderilir. 2 dakika geçerlidir.</p>
            </div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="6 haneli kod"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    required
                    style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
                />
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" style={{ width: '100%', padding: 8 }}>Doğrula</button>
            </form>
        </div>
    )
}