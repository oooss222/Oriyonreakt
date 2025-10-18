import React from 'react'
import { Link } from 'react-router-dom'

const cats = [
  {slug:'transport', label:'🚗 Авто'},
  {slug:'furniture', label:'🛋️ Мебель'},
  {slug:'phones', label:'📱 Телефоны'},
  {slug:'electronics', label:'🔌 Быт. техника'},
  {slug:'computers', label:'💻 Компьютеры'},
  {slug:'repair', label:'🛠️ Ремонт'},
]

export default function CategoryChips(){
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
      {cats.map(c => (
        <Link key={c.slug} to={`/listing?cat=${c.slug}`} className="btn">
          {c.label}
        </Link>
      ))}
    </div>
  )
}
