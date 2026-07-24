import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import {
  LOCATIONS,
  PRICE_MAX_DIGITS,
  formatPriceInput,
  getPriceDigits,
} from "../data/specOptions";

const TOKEN_KEY = "auth_token";

export default function EditListing() {
  const { id } = useParams();
  const nav = useNavigate();
  const token = localStorage.getItem(TOKEN_KEY) || "";

  const [form, setForm] = React.useState({
    title: "",
    price: "",
    location: "Душанбе",
    cat: "",
    subcategory: "",
    description: "",
  });

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (!token) {
      window.location.href = "/auth";
      return;
    }

    let alive = true;

    api
      .listingById(id)
      .then((ad) => {
        if (!alive) return;

        const savedLocation = ad.location || ad.city || LOCATIONS[0];

        setForm({
          title: ad.title || "",
          price: ad.price
            ? formatPriceInput(getPriceDigits(String(ad.price)))
            : "",
          location: savedLocation,
          cat: ad.cat || "",
          subcategory: ad.subcategory || "",
          description: ad.description || "",
        });
      })
      .catch((e) => {
        if (alive) setErr(e.message || "Ошибка загрузки объявления");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id, token]);

  const setField = (key, value) => {
    setForm((state) => ({
      ...state,
      [key]: value,
    }));
  };

  const priceDigits = getPriceDigits(form.price);

  const handlePriceChange = (rawValue) => {
    setField("price", formatPriceInput(rawValue));
  };

  const locationOptions = React.useMemo(() => {
    if (form.location && !LOCATIONS.includes(form.location)) {
      return [form.location, ...LOCATIONS];
    }

    return LOCATIONS;
  }, [form.location]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.title.trim() || !form.cat.trim()) {
      setErr("Заполните название и категорию");
      return;
    }

    if (getPriceDigits(form.price).length > PRICE_MAX_DIGITS) {
      setErr(`Цена не может быть длиннее ${PRICE_MAX_DIGITS} цифр`);
      return;
    }

    if (!form.location.trim()) {
      setErr("Выберите локацию");
      return;
    }

    try {
      setSaving(true);

      const updated = await api.updateListing(token, id, {
        title: form.title.trim(),
        price: form.price.trim(),
        location: form.location.trim(),
        cat: form.cat.trim(),
        subcategory: form.subcategory.trim(),
        description: form.description.trim(),
      });

      nav(`/ad/${updated.id || updated._id}`);
    } catch (e) {
      setErr(e.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="rounded-2xl border bg-white p-6 text-center">
          Загрузка...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="rounded-2xl border bg-white p-5 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Редактировать объявление</h1>
            <p className="text-sm text-slate-500 mt-1">
              После сохранения объявление снова уйдёт на модерацию.
            </p>
          </div>

          <Link to="/profile?tab=my" className="px-4 py-2 rounded-xl border hover:bg-slate-50">
            Назад
          </Link>
        </div>

        {err && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 p-3">
            {err}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <div className="text-sm font-medium mb-1">Название</div>
            <input
              className="input w-full"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium mb-1">Цена</div>
            <input
              className="input w-full"
              value={form.price}
              inputMode="numeric"
              autoComplete="off"
              onChange={(e) => handlePriceChange(e.target.value)}
              onPaste={(e) => {
                e.preventDefault();
                handlePriceChange(e.clipboardData.getData("text"));
              }}
            />
            <div className="mt-1 text-xs text-slate-500">
              {priceDigits.length}/{PRICE_MAX_DIGITS} цифр
            </div>
          </label>

          <label className="block">
            <div className="text-sm font-medium mb-1">Локация</div>
            <select
              className="select w-full cursor-pointer"
              value={
                locationOptions.includes(form.location)
                  ? form.location
                  : locationOptions[0]
              }
              onChange={(e) => setField("location", e.target.value)}
            >
              {locationOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm font-medium mb-1">Категория</div>
              <input
                className="input w-full"
                value={form.cat}
                onChange={(e) => setField("cat", e.target.value)}
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium mb-1">Подкатегория</div>
              <input
                className="input w-full"
                value={form.subcategory}
                onChange={(e) => setField("subcategory", e.target.value)}
              />
            </label>
          </div>

          <label className="block">
            <div className="text-sm font-medium mb-1">Описание</div>
            <textarea
              className="input w-full min-h-36 py-2"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </label>

          <button
            disabled={saving}
            className="w-full rounded-xl bg-blue-600 text-white py-3 hover:bg-blue-700 transition disabled:opacity-60"
          >
            {saving ? "Сохраняем..." : "Сохранить изменения"}
          </button>
        </form>
      </div>
    </div>
  );
}