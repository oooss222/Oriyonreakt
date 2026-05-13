import React from 'react'

/** helpers */
const toggleInArray = (arr = [], val) =>
  arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

const NumberInput = ({ value, onChange, placeholder, step = 1, className = 'input w-full' }) => (
  <input
    className={className}
    type="number"
    value={value ?? ''}
    onChange={e => onChange(e.target.value === '' ? undefined : +e.target.value)}
    placeholder={placeholder}
    step={step}
  />
)

const Select = ({ value, onChange, placeholder, options = [], className = 'select w-full', allowEmpty = true }) => (
  <select
    className={className}
    value={value ?? ''}
    onChange={e => onChange(e.target.value || undefined)}
  >
    {allowEmpty && <option value="">{placeholder}</option>}
    {options.map(opt => (
      <option key={opt} value={opt}>{opt}</option>
    ))}
  </select>
)

const Checks = ({ values = [], selected = [], onToggle }) => (
  <div className="flex flex-wrap gap-2">
    {values.map(v => (
      <label key={v} className={`btn w-fit ${selected.includes(v) ? 'bg-indigo-50 border-indigo-200' : ''}`}>
        <input type="checkbox" className="mr-2" checked={selected.includes(v)} onChange={() => onToggle(v)} />
        {v}
      </label>
    ))}
  </div>
)

const Section = ({ title, children, defaultOpen=false }) => (
  <details className="card p-3" open={defaultOpen}>
    <summary className="cursor-pointer select-none text-sm font-semibold mb-2">{title}</summary>
    <div className="space-y-2 mt-2">{children}</div>
  </details>
)

/** dictionaries */
const DICTS = {
  cities: ['Душанбе'],
  condition: ['new','used'],

  transport: {
    brands: ['Audi','BMW','Mercedes','Toyota','Hyundai','Kia','Lada','Volkswagen'],
    fuel: ['бензин','дизель','гибрид','электро'],
    transmission: ['AT','MT','CVT','DCT'],
    body: ['седан','хэтчбек','универсал','кроссовер','купе','минивэн','пикап'],
    drive: ['FWD','RWD','AWD/4x4'],
    years: Array.from({length: 2025 - 1980 + 1}, (_,i)=> 2025 - i)
  },

  phones: {
    brands: ['Apple','Samsung','Xiaomi','Realme','Huawei','Google'],
    storage: [64,128,256,512,1024],
    ram: [4,6,8,12,16]
  },

  computers: {
    type: ['ноутбук','ПК','моноблок'],
    cpu: ['Intel i5','Intel i7','Intel i9','Ryzen 5','Ryzen 7','Ryzen 9'],
    ram: [8,16,32,64],
    storageType: ['HDD','SATA SSD','NVMe']
  },

  electronics: {
    type: ['холодильник','стиральная машина','телевизор','пылесос','микроволновка','посудомойка'],
    brand: ['LG','Samsung','Bosch','Beko','Hisense','Xiaomi'],
    energy: ['A+++','A++','A+','A','B']
  },

  furniture: {
    material: ['ткань','кожа','ЭКО-кожа','масив дерева','МДФ','ДСП'],
    color: ['бежевый','серый','коричневый','чёрный','белый'],
    type: ['диван','кровать','стол','стул','шкаф','комод']
  },

  repair: {
    toolType: ['дрель','перфоратор','шуруповёрт','лобзик','болгарка','пила'],
    brand: ['Bosch','Makita','DeWalt','Metabo','Interskol'],
    powerSteps: [500,700,900,1200,1500]
  }
}

export default function Filters({ cat, value, onChange }) {
  const set = (k, v) => onChange({ ...value, [k]: v })
  const addTo = (k, v) => set(k, toggleInArray(value[k], v))

  return (
    <div className="space-y-3">
      {/* Общие секции */}
      <Section title="Цена" defaultOpen>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput value={value.min} onChange={v=>set('min', v)} placeholder="Мин TJS" />
          <NumberInput value={value.max} onChange={v=>set('max', v)} placeholder="Макс TJS" />
        </div>
        <label className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={!!value.photosOnly}
            onChange={e=> set('photosOnly', e.target.checked || undefined)}
          />
          Только с фото
        </label>
      </Section>

      <Section title="Состояние">
        <Checks
          values={DICTS.condition}
          selected={value.cond ? [value.cond] : []}
          onToggle={(v)=> set('cond', value.cond===v ? undefined : v)}
        />
      </Section>

      <Section title="Продавец">
        <div className="flex gap-2">
          <label className={`btn ${value.sellerType==='private' ? 'bg-indigo-50 border-indigo-200':''}`}>
            <input
              type="radio"
              name="sellerType"
              className="mr-2"
              checked={value.sellerType==='private'}
              onChange={()=> set('sellerType','private')}
            />
            Частник
          </label>
          <label className={`btn ${value.sellerType==='company' ? 'bg-indigo-50 border-indigo-200':''}`}>
            <input
              type="radio"
              name="sellerType"
              className="mr-2"
              checked={value.sellerType==='company'}
              onChange={()=> set('sellerType','company')}
            />
            Компания
          </label>
          {value.sellerType && (
            <button className="btn" onClick={()=> set('sellerType', undefined)}>Сброс</button>
          )}
        </div>
      </Section>

      {/* Категорийные секции — как раньше */}
      {cat === 'transport' && (
        <>
          <Section title="Модель">
            <input
              className="input w-full"
              value={value.model || ''}
              onChange={e=> set('model', e.target.value || undefined)}
              placeholder="Например: A6, Camry…"
            />
          </Section>

          <Section title="Марка" defaultOpen>
            <Checks values={DICTS.transport.brands} selected={value.brands ?? []} onToggle={v=>addTo('brands', v)} />
          </Section>

          <Section title="Год выпуска">
            <div className="grid grid-cols-2 gap-2">
              <Select placeholder="от" value={value.yearMin} onChange={v=> set('yearMin', v ? +v : undefined)} options={DICTS.transport.years.map(String)} />
              <Select placeholder="до" value={value.yearMax} onChange={v=> set('yearMax', v ? +v : undefined)} options={DICTS.transport.years.map(String)} />
            </div>
          </Section>

          <Section title="Пробег, км">
            <div className="grid grid-cols-2 gap-2">
              <NumberInput step={1000} value={value.mileageMin} onChange={v=>set('mileageMin', v)} placeholder="от" />
              <NumberInput step={1000} value={value.mileageMax} onChange={v=>set('mileageMax', v)} placeholder="до" />
            </div>
          </Section>

          <Section title="Тип топлива">
            <Checks values={DICTS.transport.fuel} selected={value.fuel ?? []} onToggle={v=>addTo('fuel', v)} />
          </Section>

          <Section title="Тип кузова">
            <Checks values={DICTS.transport.body} selected={value.body ?? []} onToggle={v=>addTo('body', v)} />
          </Section>

          <Section title="Привод">
            <Checks values={DICTS.transport.drive} selected={value.drive ?? []} onToggle={v=>addTo('drive', v)} />
          </Section>

          <Section title="Коробка передач">
            <Checks values={DICTS.transport.transmission} selected={value.transmission ?? []} onToggle={v=>addTo('transmission', v)} />
          </Section>
        </>
      )}

      {cat === 'phones' && (
        <>
          <Section title="Бренд" defaultOpen>
            <Checks values={DICTS.phones.brands} selected={value.brands ?? []} onToggle={v=>addTo('brands', v)} />
          </Section>
          <Section title="Память / RAM">
            <div className="grid grid-cols-2 gap-2">
              <Select placeholder="Память, ГБ ⩾" value={value.storageMin} onChange={v=> set('storageMin', v ? +v : undefined)} options={DICTS.phones.storage.map(String)} />
              <Select placeholder="RAM, ГБ ⩾" value={value.ramMin} onChange={v=> set('ramMin', v ? +v : undefined)} options={DICTS.phones.ram.map(String)} />
            </div>
          </Section>
        </>
      )}

      {cat === 'computers' && (
        <>
          <Section title="Тип устройства" defaultOpen>
            <Checks values={DICTS.computers.type} selected={value.deviceType ?? []} onToggle={v=>addTo('deviceType', v)} />
          </Section>
          <Section title="Процессор">
            <Checks values={DICTS.computers.cpu} selected={value.cpu ?? []} onToggle={v=>addTo('cpu', v)} />
          </Section>
          <Section title="Характеристики">
            <div className="grid grid-cols-3 gap-2">
              <Select placeholder="RAM, ГБ ⩾" value={value.ramMin} onChange={v=> set('ramMin', v ? +v : undefined)} options={DICTS.computers.ram.map(String)} />
              <Select placeholder="Накопитель" value={value.storageType} onChange={v=> set('storageType', v)} options={DICTS.computers.storageType} />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!value.hasGPU} onChange={e=> set('hasGPU', e.target.checked || undefined)} />
                Дискретная видеокарта
              </label>
            </div>
          </Section>
        </>
      )}

      {cat === 'electronics' && (
        <>
          <Section title="Тип техники" defaultOpen>
            <Checks values={DICTS.electronics.type} selected={value.eType ?? []} onToggle={v=>addTo('eType', v)} />
          </Section>
          <Section title="Бренд">
            <Checks values={DICTS.electronics.brand} selected={value.brands ?? []} onToggle={v=>addTo('brands', v)} />
          </Section>
          <Section title="Энергоэффективность">
            <Checks values={DICTS.electronics.energy} selected={value.energy ?? []} onToggle={v=>addTo('energy', v)} />
          </Section>
        </>
      )}

      {cat === 'furniture' && (
        <>
          <Section title="Тип мебели" defaultOpen>
            <Checks values={DICTS.furniture.type} selected={value.fType ?? []} onToggle={v=>addTo('fType', v)} />
          </Section>
          <Section title="Материал">
            <Checks values={DICTS.furniture.material} selected={value.material ?? []} onToggle={v=>addTo('material', v)} />
          </Section>
          <Section title="Цвет">
            <Checks values={DICTS.furniture.color} selected={value.color ?? []} onToggle={v=>addTo('color', v)} />
          </Section>
        </>
      )}

      {cat === 'repair' && (
        <>
          <Section title="Тип инструмента" defaultOpen>
            <Checks values={DICTS.repair.toolType} selected={value.toolType ?? []} onToggle={v=>addTo('toolType', v)} />
          </Section>
          <Section title="Бренд">
            <Checks values={DICTS.repair.brand} selected={value.brands ?? []} onToggle={v=>addTo('brands', v)} />
          </Section>
          <Section title="Мощность, Вт">
            <Select placeholder="⩾" value={value.powerMin} onChange={v=> set('powerMin', v ? +v : undefined)} options={DICTS.repair.powerSteps.map(String)} />
          </Section>
        </>
      )}
    </div>
  )
}
