import React from 'react'
import { useNavigate } from 'react-router-dom'

const quickCats = [
  { slug:'transport', label:'Авто' },
  { slug:'re',        label:'Недвижимость' },
  { slug:'phones',    label:'Телефоны' },
  { slug:'computers', label:'Компьютеры' },
  { slug:'electronics', label:'Техника' },
  { slug:'furniture', label:'Мебель' },
  { slug:'repair',    label:'Ремонт' },
]

export default function HeroSearch(){
  const nav = useNavigate()
  const [q, setQ] = React.useState('')
  const [cat, setCat] = React.useState('')

  const onSubmit = (e)=>{
    e.preventDefault()
    const params = new URLSearchParams()
    if(q) params.set('q', q)
    if(cat) params.set('cat', cat)
    nav(`/listing?${params.toString()}`)
  }

  return (
    <section className="relative card overflow-hidden">
      {/* фоновая “подложка” */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="relative p-5 md:p-8">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-extrabold">Найдите то, что нужно</h1>
            <p className="text-slate-600">Объявления по всему Таджикистану</p>
          </div>
          <button
            onClick={()=> nav('/auth')}
            className="btn btn-primary"
          >
            + Разместить объявление
          </button>
        </div>

        {/* строка поиска + выбор категории + город */}
        <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_220px_160px_auto] gap-2">
          <input
            className="input w-full"
            placeholder="Поиск: марка, модель, район…"
            value={q}
            onChange={e=>setQ(e.target.value)}
          />
          <select className="select w-full" value={cat} onChange={e=>setCat(e.target.value)}>
            <option value="">Все категории</option>
            {quickCats.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
          <select className="select w-full" defaultValue="">
            <option value="">Город</option>
            <option>Душанбе</option>
            <option>Худжанд</option>
            <option>Бохтар</option>
            <option>Куляб</option>
          </select>
          <button className="btn btn-primary">Найти</button>
        </form>

        {/* быстрые фильтры как pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {quickCats.map(c => (
            <button
              key={c.slug}
              onClick={()=> nav(`/listing?cat=${c.slug}`)}
              className="btn"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
