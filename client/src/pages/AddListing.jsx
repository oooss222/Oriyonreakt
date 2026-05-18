import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import {
  Plus,
  X,
  UploadCloud,
  Info,
  Sparkles,
  Image as ImageIcon,
  ListChecks,
  Tag,
  MapPin,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

const TOKEN_KEY = "auth_token";

const CATS = {
  transport: {
    title: "Авто",
    subs: [
      "Легковые авто",
      "Запчасти",
      "Услуги для авто",
      "Грузовики и автобусы",
      "Мототранспорт",
      "Сельхозтехника",
      "Спецтехника",
      "Прицепы",
      "Шины и диски",
      "Автохимия и автомасла",
    ],
    specTemplate: [
      "Марка",
      "Модель",
      "Год",
      "Пробег",
      "КПП",
      "Цвет",
      "Топливо",
      "Состояние",
    ],
  },
  furniture: {
    title: "Мебель",
    subs: [
      "Мебель для спальни",
      "Офисная мебель",
      "Мебель для гостиной",
      "Мебель для прихожей",
      "Мебель на заказ",
    ],
    specTemplate: ["Тип", "Материал", "Состояние", "Цвет", "Размеры"],
  },
  phones: {
    title: "Телефоны",
    subs: [
      "Мобильные телефоны",
      "Планшеты",
      "Мобильные аксессуары",
      "Ремонт и сервис телефонов",
    ],
    specTemplate: [
  {
    name: "Производитель",
    type: "select",
    options: ["Apple", "Samsung", "Xiaomi", "Huawei", "Honor", "Realme"],
  },
  {
    name: "Модель",
    type: "text",
  },
  {
    name: "Память",
    type: "select",
    options: ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"],
  },
  {
    name: "Состояние",
    type: "select",
    options: ["Новый", "Б/у", "Требует ремонта"],
  },
  {
    name: "Гарантия",
    type: "select",
    options: ["Да", "Нет"],
  },
],
  },
  electronics: {
    title: "Бытовая техника",
    subs: [
      "Техника для дома и кухни",
      "Видеонаблюдение и камеры",
      "Климатическая техника",
      "Обогреватели",
    ],
    specTemplate: ["Тип", "Бренд", "Состояние", "Гарантия"],
  },
  computers: {
    title: "Компьютеры и оргтехника",
    subs: ["Ноутбуки", "ПК", "Приставки", "Принтеры и сканеры"],
    specTemplate: [
      "Тип",
      "Процессор",
      "ОЗУ",
      "Накопитель",
      "Видеокарта",
      "Состояние",
    ],
  },
  repair: {
    title: "Ремонт",
    subs: [
      "Окна и двери",
      "Дома, срубы и снаряжения",
      "Средства индивидуальной защиты",
      "Ворота и заборы",
      "Стройматериалы",
      "Инструменты",
      "Прочее для ремонта",
    ],
    specTemplate: ["Тип", "Материал/Бренд", "Состояние"],
  },
};

const TITLE_MAX = 80;
const DESC_MAX = 1000;

export default function AddListing() {
  const nav = useNavigate();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const [form, setForm] = React.useState({
    title: "",
    price: "",
    location: "Душанбе",
    cat: "transport",
    subcategory: "",
    description: "",
  });

  const [specs, setSpecs] = React.useState([]);
  const [files, setFiles] = React.useState([]);
  const [previews, setPreviews] = React.useState([]);
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);

  React.useEffect(() => {
    const cat = CATS[form.cat];
    const firstSub = cat?.subs?.[0] || "";

    setForm((v) => ({
      ...v,
      subcategory: firstSub,
    }));

    const tpl = (cat?.specTemplate || []).map((item) => ({
  name: typeof item === "string" ? item : item.name,
  type: typeof item === "string" ? "text" : item.type || "text",
  options: typeof item === "string" ? [] : item.options || [],
  value: "",
}));

    setSpecs(tpl);
  }, [form.cat]);

  React.useEffect(() => {
    if (!files.length) {
      setPreviews([]);
      return;
    }

    let alive = true;

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
      )
    ).then((arr) => {
      if (alive) setPreviews(arr);
    });

    return () => {
      alive = false;
    };
  }, [files]);

  const setField = (key, value) => {
    setForm((state) => ({
      ...state,
      [key]: value,
    }));
  };

  const formatPrice = (value) => {
    const cleaned = String(value).replace(/[^\d]/g, "");
    if (!cleaned) return "";
    return new Intl.NumberFormat("ru-RU").format(Number(cleaned));
  };

  const onFiles = (list) => {
    const arr = Array.from(list || []).filter((file) =>
      file.type.startsWith("image/")
    );

    setFiles((current) => [...current, ...arr].slice(0, 10));
  };

  const onInputFiles = (event) => {
    onFiles(event.target.files);
    event.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((arr) => arr.filter((_, i) => i !== index));
    setPreviews((arr) => arr.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setFiles([]);
    setPreviews([]);
  };

  const addSpecRow = () => {
    setSpecs((state) => [...state, { name: "", value: "" }]);
  };

  const removeSpecRow = (index) => {
    setSpecs((state) => state.filter((_, i) => i !== index));
  };

  const updateSpec = (index, key, value) => {
    setSpecs((state) =>
      state.map((row, i) =>
        i === index
          ? {
              ...row,
              [key]: value,
            }
          : row
      )
    );
  };

  const resetForm = () => {
    setForm({
      title: "",
      price: "",
      location: "Душанбе",
      cat: "transport",
      subcategory: CATS.transport.subs[0],
      description: "",
    });
    setFiles([]);
    setPreviews([]);
    setErr("");
  };

  const submit = async (event) => {
    event.preventDefault();

    setErr("");

    if (!token) {
      window.location.href = "/auth";
      return;
    }

    if (!form.title.trim() || !form.cat.trim() || !form.subcategory.trim()) {
      setErr("Заполните заголовок, категорию и подкатегорию");
      return;
    }

    if (form.title.trim().length > TITLE_MAX) {
      setErr(`Заголовок не должен быть длиннее ${TITLE_MAX} символов`);
      return;
    }

    if (form.description.length > DESC_MAX) {
      setErr(`Описание не должно быть длиннее ${DESC_MAX} символов`);
      return;
    }

    try {
      setLoading(true);

      let uploadedImages = [];

      if (files.length) {
        const formData = new FormData();

        files.forEach((file) => {
          formData.append("images", file);
        });

        const uploaded = await api.uploadImages(token, formData);

        uploadedImages = (uploaded?.urls || []).map((url) => ({
          url,
          alt: form.title.trim(),
        }));
      }

      const compactSpecs = specs
      .filter(
        (item) =>
          String(item.name || "").trim() &&
          String(item.value || "").trim()
      )
      .map((item) => ({
        name: String(item.name || "").trim(),
        value: String(item.value || "").trim(),
      }));

      const created = await api.createListing(token, {
        title: form.title.trim(),
        price: form.price || "",
        location: form.location || "",
        cat: form.cat.trim(),
        subcategory: form.subcategory.trim(),
        description: form.description || "",
        specs: compactSpecs,
        images: uploadedImages,
      });

      nav(`/ad/${created.id || created._id}`);
    } catch (error) {
      setErr(error.message || "Ошибка создания");
    } finally {
      setLoading(false);
    }
  };

  const cat = CATS[form.cat];
  const subs = cat?.subs || [];
  const photosCount = previews.length;
  const filledSpecs = specs.filter(
  (item) =>
    String(item.name || "").trim() &&
    String(item.value || "").trim()
).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-900">
      <div className="rounded-2xl border bg-white p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-2">
              <Sparkles className="w-4 h-4" />
              Новое объявление
            </div>

            <h1 className="text-2xl font-bold">Создать объявление</h1>

            <p className="text-slate-600 text-sm mt-1">
              Заполните данные, загрузите фото и опубликуйте объявление.
            </p>
          </div>

          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 hover:bg-slate-50"
          >
            <RotateCcw className="w-4 h-4" />
            Сбросить
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4">
          {err}
        </div>
      )}

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-white p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Основная информация</h2>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Заголовок
              </label>

              <input
                value={form.title}
                onChange={(e) =>
                  setField("title", e.target.value.slice(0, TITLE_MAX))
                }
                placeholder="Например: Toyota Camry 2018"
                className="w-full h-11 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="mt-1 text-xs text-slate-500">
                {form.title.length}/{TITLE_MAX}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Цена
                </label>

                <input
                  value={form.price}
                  onChange={(e) => setField("price", formatPrice(e.target.value))}
                  placeholder="Например: 120 000"
                  className="w-full h-11 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Локация
                </label>

                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />

                  <input
                    value={form.location}
                    onChange={(e) => setField("location", e.target.value)}
                    placeholder="Душанбе"
                    className="w-full h-11 rounded-lg border pl-9 pr-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Категория
                </label>

                <select
                  value={form.cat}
                  onChange={(e) => setField("cat", e.target.value)}
                  className="w-full h-11 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(CATS).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Подкатегория
                </label>

                <select
                  value={form.subcategory}
                  onChange={(e) => setField("subcategory", e.target.value)}
                  className="w-full h-11 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {subs.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Описание
              </label>

              <textarea
                value={form.description}
                onChange={(e) =>
                  setField("description", e.target.value.slice(0, DESC_MAX))
                }
                rows={7}
                placeholder="Опишите товар, состояние, комплектацию и условия сделки"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />

              <div className="mt-1 text-xs text-slate-500">
                {form.description.length}/{DESC_MAX}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Фотографии</h2>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                onFiles(e.dataTransfer.files);
              }}
              className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
                isDragOver
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <UploadCloud className="w-10 h-10 mx-auto text-slate-400 mb-2" />

              <div className="font-medium">
                Перетащите фото сюда или выберите файлы
              </div>

              <div className="text-sm text-slate-500 mt-1">
                До 10 изображений. JPG, PNG, WEBP.
              </div>

              <label className="inline-flex items-center justify-center gap-2 mt-4 rounded-xl border bg-white px-4 py-2 hover:bg-slate-50 cursor-pointer">
                <Plus className="w-4 h-4" />
                Выбрать фото
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onInputFiles}
                  className="hidden"
                />
              </label>
            </div>

            {previews.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-500">
                    Выбрано: {photosCount}
                  </div>

                  <button
                    type="button"
                    onClick={clearFiles}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Очистить
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {previews.map((src, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={src}
                        alt={`Фото ${index + 1}`}
                        className="w-full h-28 object-cover rounded-xl border bg-slate-100"
                      />

                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute right-1 top-1 rounded-full bg-black/70 text-white p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                        title="Удалить фото"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Характеристики</h2>
              </div>

              <button
                type="button"
                onClick={addSpecRow}
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 hover:bg-slate-50"
              >
                <Plus className="w-4 h-4" />
                Добавить
              </button>
            </div>

            <div className="space-y-3">
              {specs.map((spec, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
                >
                  <input
                    value={spec.name}
                    onChange={(e) => updateSpec(index, "name", e.target.value)}
                    placeholder="Название"
                    className="h-10 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {spec.type === "select" ? (
                <select
                  value={spec.value}
                  onChange={(e) => updateSpec(index, "value", e.target.value)}
                  className="h-10 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите</option>

                  {spec.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={spec.value}
                  onChange={(e) => updateSpec(index, "value", e.target.value)}
                  placeholder="Значение"
                  className="h-10 rounded-lg border px-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

                  <button
                    type="button"
                    onClick={() => removeSpecRow(index)}
                    className="h-10 w-10 inline-flex items-center justify-center rounded-lg border text-red-600 hover:bg-red-50"
                    title="Удалить характеристику"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {specs.length === 0 && (
                <div className="text-sm text-slate-500">
                  Характеристики не добавлены.
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border bg-white p-5 space-y-4 sticky top-4">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Публикация</h2>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span>Категория</span>
                <span className="font-medium text-slate-900">
                  {cat?.title || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span>Подкатегория</span>
                <span className="font-medium text-slate-900 text-right">
                  {form.subcategory || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span>Фото</span>
                <span className="font-medium text-slate-900">
                  {photosCount}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span>Характеристики</span>
                <span className="font-medium text-slate-900">
                  {filledSpecs}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-white transition ${
                loading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {loading ? "Публикация..." : "Опубликовать"}
            </button>

            <div className="text-xs text-slate-500">
              После публикации объявление будет доступно в общем списке.
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}