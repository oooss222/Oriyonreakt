import React from 'react'

const items = [
  { q: 'Как разместить объявление?', a: 'Нажмите «Разместить объявление», заполните форму и опубликуйте. Модерация занимает несколько минут.' },
  { q: 'Как безопасно покупать?', a: 'Встречайтесь в людных местах, проверяйте товар, не переводите предоплату неизвестным продавцам.' },
  { q: 'Как сохранить поиск?', a: 'На странице списка используйте кнопку «Сохранить поиск». Потом вы сможете быстро возвращаться к нему.' },
]

export default function FAQ(){
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">Частые вопросы</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((it, idx)=>(
          <details key={idx} className="card p-4">
            <summary className="font-semibold cursor-pointer">{it.q}</summary>
            <p className="mt-2 text-slate-600">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
