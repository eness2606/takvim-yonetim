import { useState, useEffect } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
    const { user, logout } = useAuth()
    const [events, setEvents] = useState([])
    const [view, setView] = useState('month')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [showForm, setShowForm] = useState(false)
    const [editingEvent, setEditingEvent] = useState(null)

    const isEditor = user?.role === 'editor'

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        const res = await api.get('/events/')
        setEvents(res.data)
    }

    const handleLogout = async () => {
        await logout()
    }

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Takvim</h2>
                <div>
                    <span style={{ marginRight: 10 }}>{user?.email} ({user?.role})</span>
                    <button onClick={handleLogout}>Çıkış</button>
                </div>
            </div>

            <div style={{ margin: '15px 0' }}>
                <button onClick={() => setView('month')} disabled={view === 'month'}>Aylık</button>
                <button onClick={() => setView('week')} disabled={view === 'week'} style={{ marginLeft: 5 }}>Haftalık</button>
                <button onClick={() => setView('day')} disabled={view === 'day'} style={{ marginLeft: 5 }}>Günlük</button>
                {isEditor && (
                    <button onClick={() => { setEditingEvent(null); setShowForm(true) }} style={{ marginLeft: 20 }}>
                        + Etkinlik Ekle
                    </button>
                )}
            </div>

            <p>Toplam {events.length} etkinlik yüklendi.</p>
        </div>
    )
}