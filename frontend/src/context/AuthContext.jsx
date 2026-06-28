import { createContext, useState, useContext } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const role = localStorage.getItem('role')
        const email = localStorage.getItem('email')
        return role ? { role, email } : null
    })

    const login = (accessToken, refreshToken, email, role) => {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        localStorage.setItem('email', email)
        localStorage.setItem('role', role)
        setUser({ email, role })
    }

    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } catch {
            // token zaten geçersizse de çıkış yap
        }
        localStorage.clear()
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext);
}
