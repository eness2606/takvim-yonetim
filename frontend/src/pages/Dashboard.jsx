import { useState, useEffect } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

function getMonthDays(date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startWeekday = (firstDay.getDay() + 6) % 7 // Pazartesi=0

    const days = []
    for (let i = 0; i < startWeekday; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    return days
}

function getWeekDays(date) {
    const day = (date.getDay() + 6) % 7
    const monday = new Date(date)
    monday.setDate(date.getDate() - day)

    const days = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        days.push(d)
    }
    return days
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
}

function eventsOnDay(events, day) {
    return events.filter(e => isSameDay(new Date(e.start_time), day))
}

const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export default function Dashboard() {
    const { user, logout } = useAuth()
    const [events, setEvents] = useState([])
    const [view, setView] = useState('month')
    const [currentDate, setCurrentDate] = useState(new Date())
    const [showForm, setShowForm] = useState(false)
    const [editingEvent, setEditingEvent] = useState(null)

    const [formTitle, setFormTitle] = useState('')
    const [formDesc, setFormDesc] = useState('')
    const [formStart, setFormStart] = useState('')
    const [formEnd, setFormEnd] = useState('')

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

    const openCreateForm = () => {
        setEditingEvent(null)
        setFormTitle(''); setFormDesc(''); setFormStart(''); setFormEnd('')
        setShowForm(true)
    }

    const openEditForm = (event) => {
        setEditingEvent(event)
        setFormTitle(event.title)
        setFormDesc(event.description)
        setFormStart(event.start_time.slice(0, 16))
        setFormEnd(event.end_time.slice(0, 16))
        setShowForm(true)
    }

    const handleSubmitForm = async (e) => {
        e.preventDefault()
        const payload = {
            title: formTitle,
            description: formDesc,
            start_time: formStart,
            end_time: formEnd
        }
        if (editingEvent) {
            await api.put(`/events/${editingEvent.id}`, payload)
        } else {
            await api.post('/events/', payload)
        }
        setShowForm(false)
        fetchEvents()
    }

    const handleDelete = async (id) => {
        if (!confirm('Bu etkinliği silmek istediğine emin misin?')) return
        await api.delete(`/events/${id}`)
        fetchEvents()
    }

    const goPrev = () => {
        const d = new Date(currentDate)
        if (view === 'month') d.setMonth(d.getMonth() - 1)
        else if (view === 'week') d.setDate(d.getDate() - 7)
        else d.setDate(d.getDate() - 1)
        setCurrentDate(d)
    }

    const goNext = () => {
        const d = new Date(currentDate)
        if (view === 'month') d.setMonth(d.getMonth() + 1)
        else if (view === 'week') d.setDate(d.getDate() + 7)
        else d.setDate(d.getDate() + 1)
        setCurrentDate(d)
    }

    const goToday = () => setCurrentDate(new Date())

    const renderEventChip = (ev) => (
        <div key={ev.id} style={{ background: '#3b82f6', color: 'white', borderRadius: 4, padding: '2px 6px', marginTop: 4, fontSize: 12 }}>
            <div>{ev.title}</div>
            {isEditor && (
                <div style={{ marginTop: 2 }}>
                    <button onClick={() => openEditForm(ev)} style={{ fontSize: 11, marginRight: 4 }}>Düzenle</button>
                    <button onClick={() => handleDelete(ev.id)} style={{ fontSize: 11 }}>Sil</button>
                </div>
            )}
        </div>
    )

    const renderMonthView = () => {
        const days = getMonthDays(currentDate)
        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', fontWeight: 'bold', marginBottom: 5 }}>
                    {WEEKDAY_LABELS.map(label => <div key={label}>{label}</div>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                    {days.map((day, i) => (
                        <div key={i} style={{ minHeight: 90, border: '1px solid #444', padding: 4, background: day && isSameDay(day, new Date()) ? '#1e293b' : 'transparent' }}>
                            {day && (
                                <>
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>{day.getDate()}</div>
                                    {eventsOnDay(events, day).map(renderEventChip)}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const renderWeekView = () => {
        const days = getWeekDays(currentDate)
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {days.map((day, i) => (
                    <div key={i} style={{ minHeight: 200, border: '1px solid #444', padding: 4, background: isSameDay(day, new Date()) ? '#1e293b' : 'transparent' }}>
                        <div style={{ fontWeight: 'bold', fontSize: 12 }}>{WEEKDAY_LABELS[i]} {day.getDate()}</div>
                        {eventsOnDay(events, day).map(renderEventChip)}
                    </div>
                ))}
            </div>
        )
    }

    const renderDayView = () => {
        const dayEvents = eventsOnDay(events, currentDate)
        return (
            <div style={{ border: '1px solid #444', padding: 10, minHeight: 200 }}>
                {dayEvents.length === 0 && <p style={{ opacity: 0.6 }}>Bu gün için etkinlik yok.</p>}
                {dayEvents.map(renderEventChip)}
            </div>
        )
    }

    const headerLabel = () => {
        if (view === 'month') return currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
        if (view === 'day') return currentDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
        const days = getWeekDays(currentDate)
        return `${days[0].toLocaleDateString('tr-TR')} - ${days[6].toLocaleDateString('tr-TR')}`
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
                    <button onClick={openCreateForm} style={{ marginLeft: 20 }}>
                        + Etkinlik Ekle
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <button onClick={goPrev}>←</button>
                <button onClick={goToday}>Bugün</button>
                <button onClick={goNext}>→</button>
                <strong>{headerLabel()}</strong>
            </div>

            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}

            {showForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <form onSubmit={handleSubmitForm} style={{ background: '#1e1e1e', padding: 20, borderRadius: 8, width: 320 }}>
                        <h3>{editingEvent ? 'Etkinlik Düzenle' : 'Yeni Etkinlik'}</h3>
                        <input
                            type="text" placeholder="Başlık" value={formTitle}
                            onChange={e => setFormTitle(e.target.value)} required
                            style={{ display: 'block', width: '100%', marginBottom: 8, padding: 6 }}
                        />
                        <textarea
                            placeholder="Açıklama" value={formDesc}
                            onChange={e => setFormDesc(e.target.value)}
                            style={{ display: 'block', width: '100%', marginBottom: 8, padding: 6 }}
                        />
                        <label style={{ fontSize: 12 }}>Başlangıç</label>
                        <input
                            type="datetime-local" value={formStart}
                            onChange={e => setFormStart(e.target.value)} required
                            style={{ display: 'block', width: '100%', marginBottom: 8, padding: 6 }}
                        />
                        <label style={{ fontSize: 12 }}>Bitiş</label>
                        <input
                            type="datetime-local" value={formEnd}
                            onChange={e => setFormEnd(e.target.value)} required
                            style={{ display: 'block', width: '100%', marginBottom: 12, padding: 6 }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button type="button" onClick={() => setShowForm(false)}>Vazgeç</button>
                            <button type="submit">Kaydet</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
