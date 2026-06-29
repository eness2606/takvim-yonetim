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
        <div key={ev.id} className="event-chip">
            <div className="event-title">{ev.title}</div>
            {isEditor && (
                <div className="event-actions">
                    <button onClick={() => openEditForm(ev)}>Düzenle</button>
                    <button onClick={() => handleDelete(ev.id)}>Sil</button>
                </div>
            )}
        </div>
    )

    const renderMonthView = () => {
        const days = getMonthDays(currentDate)
        return (
            <div>
                <div className="weekday-row">
                    {WEEKDAY_LABELS.map(label => <div key={label}>{label}</div>)}
                </div>
                <div className="month-grid">
                    {days.map((day, i) => (
                        <div key={i} className={`day-cell ${!day ? 'empty' : ''} ${day && isSameDay(day, new Date()) ? 'today' : ''}`}>
                            {day && (
                                <>
                                    <div className="day-number">{day.getDate()}</div>
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
            <div className="week-grid">
                {days.map((day, i) => (
                    <div key={i} className={`week-cell ${isSameDay(day, new Date()) ? 'today' : ''}`}>
                        <div className="week-cell-label">{WEEKDAY_LABELS[i]} {day.getDate()}</div>
                        {eventsOnDay(events, day).map(renderEventChip)}
                    </div>
                ))}
            </div>
        )
    }

    const renderDayView = () => {
        const dayEvents = eventsOnDay(events, currentDate)
        return (
            <div className="day-view">
                {dayEvents.length === 0 && <p className="empty-hint">Bu gün için etkinlik yok.</p>}
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
        <div className="dashboard">
            <div className="dashboard-header">
                <h2>Takvim</h2>
                <div>
                    <span className="user-pill">{user?.email} ({user?.role})</span>
                    <button onClick={handleLogout}>Çıkış</button>
                </div>
            </div>

            <div className="toolbar">
                <div className="view-tabs">
                    <button onClick={() => setView('month')} disabled={view === 'month'}>Aylık</button>
                    <button onClick={() => setView('week')} disabled={view === 'week'}>Haftalık</button>
                    <button onClick={() => setView('day')} disabled={view === 'day'}>Günlük</button>
                </div>
                <div className="spacer" />
                {isEditor && (
                    <button onClick={openCreateForm}>+ Etkinlik Ekle</button>
                )}
            </div>

            <div className="nav-bar">
                <button onClick={goPrev}>←</button>
                <button onClick={goToday}>Bugün</button>
                <button onClick={goNext}>→</button>
                <strong>{headerLabel()}</strong>
            </div>

            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}

            {showForm && (
                <div className="modal-overlay">
                    <form onSubmit={handleSubmitForm} className="modal-card">
                        <h3>{editingEvent ? 'Etkinlik Düzenle' : 'Yeni Etkinlik'}</h3>
                        <div className="field">
                            <input
                                type="text" placeholder="Başlık" value={formTitle}
                                onChange={e => setFormTitle(e.target.value)} required
                            />
                        </div>
                        <div className="field">
                            <textarea
                                placeholder="Açıklama" value={formDesc}
                                onChange={e => setFormDesc(e.target.value)}
                            />
                        </div>
                        <div className="field">
                            <label>Başlangıç</label>
                            <input
                                type="datetime-local" value={formStart}
                                onChange={e => setFormStart(e.target.value)} required
                            />
                        </div>
                        <div className="field">
                            <label>Bitiş</label>
                            <input
                                type="datetime-local" value={formEnd}
                                onChange={e => setFormEnd(e.target.value)} required
                            />
                        </div>
                        <div className="modal-actions">
                            <button type="button" onClick={() => setShowForm(false)}>Vazgeç</button>
                            <button type="submit">Kaydet</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
