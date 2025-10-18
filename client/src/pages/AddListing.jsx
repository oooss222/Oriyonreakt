import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const TOKEN_KEY = "auth_token";

const Input = (p) => (
  <input {...p} className={`input w-full ${p.className || ""}`} />
);
const Textarea = (p) => (
  <textarea {...p} className={`input w-full min-h-28 ${p.className || ""}`} />
);
const Label = ({ children }) => (
  <label className="text-sm font-medium">{children}</label>
);
const ErrorText = ({ children }) =>
  children ? <div className="text-red-600 text-sm">{children}</div> : null;

export default function AddListing() {
  const nav = useNavigate();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  React.useEffect(() => {
    if (!token) nav("/auth");
  }, [token, nav]);

  const [form, setForm] = React.useState({
    title: "",
    price: "",
    location: "",
    cat: "",
    description: "",
    // imageUrls: "" // больше не нужно — уходим на загрузку файлов
  });

  const [files, setFiles] = React.useState([]); // File[]
  const [previews, setPreviews] = React.useState([]); // dataURL[]
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  const onPickFiles = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);

    // превью
    Promise.all(
      list.map(
        (f) =>
          new Promise((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.readAsDataURL(f);
          })
      )
    ).then(setPreviews);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      if (!form.title.trim() || !form.cat.trim()) {
        throw new Error("Заполните заголовок и категорию");
      }

      // 1) грузим изображения
      let images = [];
      if (files.length) {
        for (const file of files) {
          const { url } = await api.uploadImage(token, file);
          images.push({ url });
        }
      }

      // 2) создаем объявление
      const created = await api.createListing(token, {
        title: form.title.trim(),
        price: form.price.trim(),
        location: form.location.trim(),
        cat: form.cat.trim(),
        description: form.description.trim(),
        images,
      });

      nav(`/ad/${created.id || created._id}`);
    } catch (e) {
      setErr(e.message || "Не удалось создать объявление");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-x py-6">
      <div className="max-w-2xl mx-auto card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Добавить объявление</h1>
        </div>

        {err && <ErrorText>{err}</ErrorText>}

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label>Заголовок *</Label>
            <Input
              placeholder="Например: Toyota Camry 2018, 2.5 л"
              value={form.title}
              onChange={(e) =>
                setForm((v) => ({ ...v, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="space-y-1 md:col-span-1">
              <Label>Цена</Label>
              <Input
                placeholder="155 000 TJS"
                value={form.price}
                onChange={(e) =>
                  setForm((v) => ({ ...v, price: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label>Город</Label>
              <Input
                placeholder="Душанбе"
                value={form.location}
                onChange={(e) =>
                  setForm((v) => ({ ...v, location: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label>Категория *</Label>
              <select
                className="select w-full"
                value={form.cat}
                onChange={(e) =>
                  setForm((v) => ({ ...v, cat: e.target.value }))
                }
                required
              >
                <option value="">Выберите категорию</option>
                <option value="transport">Авто</option>
                <option value="furniture">Мебель</option>
                <option value="phones">Телефоны</option>
                <option value="electronics">Бытовая техника</option>
                <option value="computers">Компьютеры и оргтехника</option>
                <option value="repair">Ремонт</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Описание</Label>
            <Textarea
              placeholder="Кратко опишите состояние и особенности..."
              value={form.description}
              onChange={(e) =>
                setForm((v) => ({ ...v, description: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1">
            <Label>Фотографии (можно несколько)</Label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onPickFiles}
            />
            {previews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                {previews.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`preview-${i}`}
                    className="w-full h-24 object-cover rounded-card border"
                  />
                ))}
              </div>
            )}
          </div>

          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Сохраняем…" : "Создать объявление"}
          </button>
        </form>
      </div>
    </div>
  );
}
