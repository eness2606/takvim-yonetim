# Takvim Yönetim Uygulaması

Staj ödevi kapsamında geliştirdiğim full-stack takvim uygulaması. React + FastAPI + PostgreSQL + Redis + Docker kullanıyor.

İki rol var: Editor ve Viewer. Editor etkinlik ekleyip silebiliyor, Viewer sadece görüntüleyebiliyor. Editor girişinde ayrıca OTP doğrulaması isteniyor.

## Kurulum

Docker ve Docker Compose kurulu olması yeterli.

```bash
git clone https://github.com/eness2606/takvim-yonetim.git
cd takvim-yonetim
docker compose up --build
```

Komut bitince (terminalde "Application startup complete" yazısını görünce):

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API dokümantasyonu (Swagger): http://localhost:8000/docs

Gerekli ortam değişkenleri `.env.example` dosyasında var. İstersen kopyalayıp `.env` olarak kullanabilirsin, kopyalamasan da `docker-compose.yml`'deki varsayılan değerlerle çalışıyor.

## Test kullanıcıları

Veritabanı boşken uygulama ilk açıldığında otomatik olarak şu kullanıcılar ve birkaç örnek etkinlik oluşturuluyor (`seed.py`):

| Kullanıcı adı | Email | Şifre | Rol |
|---|---|---|---|
| editor_user | editor@test.com | Editor123 | Editor (OTP gerekli) |
| viewer_user | viewer@test.com | Viewer123 | Viewer |

Kayıt ol sayfasından kendi hesabını da oluşturabilirsin. Şifre en az 8 karakter olmalı, içinde en az 1 büyük harf ve 1 rakam olması gerekiyor.

## Neler var

- JWT ile giriş/çıkış, access token 15 dakika, refresh token 7 gün, ikisi de Redis'te tutuluyor
- Editor girişinde 6 haneli OTP soruluyor, Redis'te 2 dakika geçerli. Aynı kullanıcı tekrar giriş denerse eski OTP geçersiz oluyor
- Viewer girişinde OTP yok, direkt giriyor
- Çıkış yapınca token Redis'ten siliniyor, o tokenla bir daha istek atılamıyor
- Editor etkinlik ekleyebiliyor/düzenleyebiliyor/silebiliyor, Viewer bunu denerse 403 hatası alıyor
- Editor kullanıcı listesini görebiliyor (`/users/`)
- Aylık, haftalık, günlük takvim görünümü var, ileri/geri/bugün ile gezinilebiliyor
- Etkinliklerde başlığa göre arama ve tarih aralığı filtresi var
- Etkinlik listesi sayfalanabiliyor (skip/limit parametreleri)
- Mobilde de düzgün görünüyor (responsive)

## Teknolojiler

- Backend: FastAPI (Python)
- Frontend: React + Vite
- Veritabanı: PostgreSQL
- Redis: token ve OTP saklamak için
- Docker Compose ile hepsi birlikte ayağa kalkıyor

## Proje yapısı

```
backend/
  main.py              # uygulamanın girişi, router'ları burada topluyor
  app/
    routers/
      auth.py           # kayıt, giriş, otp doğrulama, refresh, logout
      events.py         # etkinlik crud + arama/sayfalama
      users.py          # kullanıcı listesi
    models.py           # User ve Event tabloları
    schemas.py          # gelen/giden veri şemaları, şifre kontrolü burada
    auth_utils.py        # jwt üretimi, otp üretimi/kontrolü, şifre hashleme
    dependencies.py      # giriş kontrolü ve editor yetkisi kontrolü
    database.py          # postgres bağlantısı
    redis_client.py      # redis bağlantısı
    seed.py              # test kullanıcıları ve örnek etkinlikler

frontend/
  src/
    pages/               # Login, Register, OtpVerify, Dashboard
    context/             # giriş yapan kullanıcı bilgisini tutan AuthContext
    components/          # PrivateRoute, giriş yapmayanı login'e atıyor
    api/                 # axios ayarları, token'ı otomatik ekliyor ve yeniliyor
```

## Notlar

OTP kodu normalde email/SMS ile gönderilir ama staj ortamında email sunucusu kurmak gerekmediği için kod direkt ekranda gösteriliyor (giriş cevabında dönüyor).

Docker Compose dosyasında backend ve frontend için volume tanımladım, böylece kod değiştirdiğimde container'ı yeniden build etmeden değişiklik anında yansıyor.

Veritabanı tablolarını migration aracı yerine `create_all()` ile oluşturuyorum, o yüzden modelde değişiklik yaparsam `docker compose down -v` ile veritabanını sıfırlamam gerekiyor.
