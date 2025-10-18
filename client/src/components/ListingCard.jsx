import React from 'react'

export default function ListingCard({ item, onFav }){
  const [fav, setFav] = React.useState(() => {
    const f = new Set(JSON.parse(localStorage.getItem('favs')||'[]'))
    return f.has(item.id)
  })
  const toggle = ()=>{
    const f = new Set(JSON.parse(localStorage.getItem('favs')||'[]'))
    if(f.has(item.id)){ f.delete(item.id); setFav(false) }
    else { f.add(item.id); setFav(true) }
    localStorage.setItem('favs', JSON.stringify([...f]))
    onFav?.(item.id, !fav)
  }
  return (
    <article className="card overflow-hidden">
      <img src={item.image} alt="" className="w-full h-40 object-cover bg-indigo-50"/>
      <div className="p-3">
        <div className="badge">{item.city}</div>
        <h3 className="mt-2 text-sm font-semibold">{item.title}</h3>
        <div className="flex items-center justify-between mt-2">
          <strong>{new Intl.NumberFormat('ru-RU',{style:'currency',currency:'TJS',maximumFractionDigits:0}).format(item.price)}</strong>
          <button className={`btn ${fav?'bg-amber-50 border-amber-200':''}`} onClick={toggle} title="В избранное">★</button>
        </div>
      </div>
    </article>
  )
}
