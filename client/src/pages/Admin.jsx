import React from 'react'

export default function Admin(){
  return (
    <div className="container-x py-4">
      <div className="card p-4">
        <h1 className="text-xl font-bold">Панель администратора</h1>
        <p className="text-slate-600 mt-1">Демо: управление категориями, модерация, пользователи.</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="badge">Модерация</span>
          <span className="badge">Категории</span>
          <span className="badge">Платежи</span>
        </div>
      </div>
    </div>
  )
}
