# Takvim Yönetim Uygulaması

Full-stack takvim yönetim uygulaması — React + FastAPI + PostgreSQL + Redis + Docker.

## Kurulum (Tek Komut)

```bash
docker compose up --build
```

Sistem ayağa kalktıktan sonra:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **Swagger Docs:** http://localhost:8000/docs

## Test Kullanıcıları

| Email | Şifre | Rol |
|-------|-------|-----|
| editor@test.com | Editor123 | Editor (OTP gerekli) |
| viewer@test.com | Viewer123 | Viewer |

## Özellikler

- **Kimlik Doğrulama:** JWT tabanlı (access + refresh token), kayıt ol / giriş yap / çıkış yap
- **OTP:** Editor girişinde 6 haneli OTP (Redis ile 2 dakika geçerli)
- **RBAC:** Editor etkinlik oluşturur/düzenler/siler; Viewer yalnızca görüntüler
- **Takvim Görünümleri:** Aylık, haftalık, günlük görünüm + gezinme (ileri/geri/bugün)
- **Etkinlik Yönetimi:** Oluşturma, düzenleme, silme (editor rolü)
- **Token Yönetimi:** 15 dk access token, Redis ile blacklist/refresh

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Backend | FastAPI (Python 3.11) |
| Frontend | React 18 + Vite |
| Veritabanı | PostgreSQL 15 |
| Cache / OTP | Redis 7 |
| Konteyner | Docker + Compose |

## Mimari

```
takvim-yonetim/
├── backend/
│   ├── app/
│   │   ├── routers/        # auth.py, events.py
│   │   ├── models.py       # SQLAlchemy modelleri (User, Event)
│   │   ├── schemas.py      # Pydantic request/response şemaları
│   │   ├── auth_utils.py   # JWT, OTP, şifre hashleme
│   │   ├── dependencies.py # get_current_user, require_editor (RBAC)
│   │   ├── database.py     # PostgreSQL bağlantısı
│   │   ├── redis_client.py # Redis bağlantısı
│   │   └── seed.py         # Test verisi
│   └── main.py
└── frontend/
    └── src/
        ├── pages/           # Login, Register, OtpVerify, Dashboard
        ├── context/         # AuthContext (kullanıcı durumu)
        ├── components/      # PrivateRoute
        └── api/             # axios istemcisi (token interceptor)
```

## OTP Notu

Staj ortamı için OTP kodu giriş yanıtında döndürülmektedir ve ekranda gösterilir.
Production ortamında bu kod email/SMS ile gönderilmelidir.

## Geliştirme

`docker-compose.yml` içinde backend ve frontend için volume mount tanımlıdır —
kod değişiklikleri container'a anında yansır, yeniden build gerekmez.
