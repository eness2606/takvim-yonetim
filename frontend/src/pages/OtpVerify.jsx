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
    <div className="auth-page">
      <div className="auth-card">
        <h2>OTP Doğrulama</h2>
        <div className="message message-otp">
          <div>Dev Mode kodunuz: <strong>{otp_code}</strong></div>
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.85 }}>
            Gerçek ortamda bu kod email ile gönderilir. 2 dakika geçerlidir.
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <input
              type="text"
              placeholder="6 haneli kod"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              maxLength={6}
              required
            />
          </div>
          {error && <div className="message message-error">{error}</div>}
          <button type="submit">Doğrula</button>
        </form>
      </div>
    </div>
  )
}
