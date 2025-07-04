
# YemekTarifiPlus

YemekTarifiPlus, modern mikroservis mimarisiyle geliştirilmiş, yapay zeka destekli bir yemek tarifi platformudur. Kullanıcılar tarif ekleyebilir, AI ile tarif önerileri alabilir, yorum yapabilir ve sosyal bir yemek topluluğu oluşturabilir.

---

## Genel Bakış

YemekTarifiPlus, kullanıcıların yemek tariflerini paylaşabildiği, tariflere yorum yapabildiği ve beğenebildiği, ayrıca yapay zeka ile malzeme bazlı tarif önerileri alabileceği bir platformdur. Sistem, ölçeklenebilirlik ve sürdürülebilirlik için mikroservis mimarisiyle tasarlanmıştır.

---

## Kullanılan Teknolojiler

### Frontend
- **React 19**: Modern SPA geliştirme
- **TypeScript**: Tip güvenliği
- **Vite**: Hızlı geliştirme ve build aracı
- **TailwindCSS**: Utility-first CSS framework
- **MUI (Material UI)**: UI bileşenleri
- **Zustand**: Global state yönetimi
- **React Router v7**: Routing
- **Axios**: HTTP istekleri
- **JWT Decode**: Token yönetimi
- **React Icons**: İkon kütüphanesi

### Backend (Her servis için .NET 6)
- **.NET 6 Web API**: Mikroservisler için temel framework
- **Entity Framework Core**: ORM (RecipeService, UserService)
- **MongoDB.Driver**: NoSQL (CommentService, UserService)
- **Npgsql**: PostgreSQL bağlantısı
- **RabbitMQ.Client**: Mesajlaşma altyapısı
- **StackExchange.Redis**: Cache altyapısı
- **Serilog**: Loglama (Console, File, Seq)
- **Swashbuckle (Swagger)**: API dokümantasyonu
- **Azure.Storage.Blobs**: Medya dosyaları için blob storage (MediaService)
- **SendGrid**: E-posta gönderimi (NotificationService)
- **Microsoft.AspNetCore.Authentication.JwtBearer**: JWT tabanlı kimlik doğrulama
- **BCrypt.Net-Next**: Şifreleme (UserService)
- **SignalR**: Gerçek zamanlı bildirimler (NotificationService)

### Altyapı
- **PostgreSQL**: Ana veritabanı (tarifler, kullanıcılar)
- **MongoDB**: Yorumlar ve bazı kullanıcı verileri için NoSQL
- **Redis**: Hızlı cache
- **RabbitMQ**: Event tabanlı mikroservis iletişimi
- **Docker**: Servislerin konteynerleştirilmesi ve orkestrasyonu

### Yapay Zeka
- **HuggingFaceService**: OpenRouter/DeepSeek API ile AI tabanlı tarif önerileri ve başlık üretimi

---

## Mikroservisler ve Görevleri

- **RecipeService**: Tarif CRUD, AI ile tarif önerisi, popülerlik, beğeni, görüntüleme
- **CommentService**: Tariflere yorum ekleme, silme, listeleme (MongoDB)
- **MediaService**: Fotoğraf/video yükleme ve yönetimi (Azure Blob Storage)
- **NotificationService**: E-posta ve gerçek zamanlı bildirimler (SendGrid, SignalR, RabbitMQ)
- **UserService**: Kullanıcı yönetimi, kimlik doğrulama, profil işlemleri (MongoDB, PostgreSQL)
- **AdminPanelService**: Yönetici işlemleri (geliştirilebilir)

---

Geliştirilmeye devam ediliyor...
