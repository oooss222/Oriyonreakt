import React from 'react'

/**
 * Универсальный рекламный слот.
 * type: 'banner' | 'sidebar' | 'infeed'
 * Для реальной рекламы сюда подключают SDK (Yandex/Google/Direct и т.п.).
 */
export default function AdSlot({ type='banner', id, className='' }){
  const styles = {
    banner: 'w-full h-24 md:h-28',
    sidebar: 'w-full h-80',
    infeed: 'w-full h-24'
  }
  return (
    <div
      role="complementary"
      aria-label="Рекламный блок"
      data-ad-id={id}
      className={`card flex items-center justify-center text-slate-400 ${styles[type]} ${className}`}
    >
      Реклама — {type} ({id || 'demo'})
    </div>
  )
}
