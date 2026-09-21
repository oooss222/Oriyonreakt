# Diyor mobile

Flutter-клиент для [Diyor.tj](https://diyor.tj). Ходит в тот же REST API и Socket.IO, что и сайт.

## Запуск

```bash
cd mobile
flutter pub get
flutter run
```

По умолчанию API: `https://oriyonreakt-1.onrender.com/api`. Публичный сайт: `https://diyor.tj`.

Локальный бэкенд:

```bash
flutter run --dart-define=API_BASE=http://192.168.x.x:4000/api --dart-define=SITE_ORIGIN=http://192.168.x.x:4000
```

## Что уже есть

- Главная, каталог, карточка объявления
- Вход по телефону (OTP) и email
- Избранное, чат (Socket.IO), профиль
- Подача и редактирование объявления, фото
- Мои объявления: VIP/TOP, продано, архив
- Кошелёк и оплата Alif в WebView

Админка остаётся на сайте.
