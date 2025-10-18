# Oriyon.store (React + Vite + Tailwind)

Новая эргономичная версия сайта с рекламными слотами и адаптивной сеткой.

## Что внутри
- **React Router**: страницы Home, Listing (поиск/фильтры), Auth, Admin, Moderator, Category
- **Tailwind CSS**: единая дизайн-система (карточки, кнопки, чипы)
- **AdSlot**: универсальные рекламные блоки (`banner`, `sidebar`, `infeed`)
- **In-feed реклама**: вставляется каждые 6 карточек в ленту
- **Мок-данные**: `src/data/listings.json`
- **Локальное избранное**: через LocalStorage

## Запуск
```bash
npm i
npm run dev
```
Откройте http://localhost:5173

## Структура
- `src/shell/App.jsx` — общий каркас
- `src/components/*` — общие компоненты
- `src/pages/*` — страницы
- `src/data/listings.json` — тестовые объявления
- `src/styles/index.css` — Tailwind-слои и утилиты

## Настройка рекламы
Компонент `AdSlot` — заглушка. Замените содержимое на код вставки рекламной сети (GAM/AdSense/Яндекс). Слоты уже размечены на:
- Top banner (Home, Listing)
- Sidebar (Home, Listing)
- In-feed (Listing)
