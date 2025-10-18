import React from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export default function Profile() {
  const token = localStorage.getItem(TOKEN_KEY) || "";
  const [me, setMe] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  });

  const [tab, setTab] = React.useState("profile"); // profile | my | fav
  const [form, setForm] = React.useState({
    name: me?.name || "",
    email: me?.email || "",
    phone: me?.phone || "",
    sellerType: me?.sellerType || "private",
  });
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const [saving, setSaving] = React.useState(false); // ✅ индикатор автосохранения

  const [myItems, setMyItems] = React.useState([]);
  const [favItems, setFavItems] = React.useState([]);

  React.useEffect(() => {
    if (!token) return;
    api
      .me(token)
      .then((u) => {
        if (u) {
          setMe(u);
          setForm({
            name: u.name || "",
            email: u.email || "",
            phone: u.phone || "",
            sellerType: u.sellerType || "private",
          });
          localStorage.setItem(USER_KEY, JSON.stringify(u));
        }
      })
      .catch(() => {});
  }, [token]);

  // подгружаем данные для вкладок
  React.useEffect(() => {
    if (!token) return;
    if (tab === "my") {
      api
        .myListings(token)
        .then(setMyItems)
        .catch(() => setMyItems([]));
    }
    if (tab === "fav") {
      api
        .favorites(token)
        .then(setFavItems)
        .catch(() => setFavItems([]));
    }
  }, [tab, token]);

  if (!token) {
    return (
      <div className="container-x py-10">
        <div className="card p-6 text-center space-y-3">
          <h1 className="text-2xl font-bold">Личный кабинет</h1>
          <p className="text-slate-600">Вы не авторизованы.</p>
          <Link to="/auth" className="btn btn-primary">
            Войти / Зарегистрироваться
          </Link>
        </div>
      </div>
    );
  }

  // ======= Ручное сохранение (кнопка как резерв) =======
  const save = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      if (!form.name.trim() || !form.email.trim())
        throw new Error("Заполните имя и email");
      const u = await api.updateMe(token, {
        name: form.name,
        phone: form.phone,
        sellerType: form.sellerType,
      });
      if (u) {
        setMe(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        setMsg("Профиль сохранён");
      }
    } catch (e) {
      setErr(e.message || "Ошибка сохранения");
    }
  };

  // ======= ✅ АВТОСОХРАНЕНИЕ с debounce 800 мс =======
  const firstLoadRef = React.useRef(true);
  React.useEffect(() => {
    if (!me || !token) return;
    // пропускаем автосейв при первичном заполнении формы с сервера
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      return;
    }

    // если email пустой (не пришёл ещё) — не сохраняем
    if (!form.email) return;

    setSaving(true);
    setMsg("");
    setErr("");

    const timer = setTimeout(async () => {
      try {
        const u = await api.updateMe(token, {
          name: form.name,
          phone: form.phone,
          sellerType: form.sellerType,
        });
        if (u) {
          setMe(u);
          localStorage.setItem(USER_KEY, JSON.stringify(u));
          setMsg("Профиль сохранён");
        }
        setSaving(false);
      } catch (e) {
        setSaving(false);
        setErr(e.message || "Ошибка сохранения");
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [form.name, form.phone, form.sellerType, form.email, token, me]);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = "/auth";
  };

  const Grid = ({ items }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {(items || []).map((ad) => {
        const id = ad._id || ad.id;
        const imgUrl = ad.images?.[0]?.url || ad.img || "/img/placeholder.jpg";
        return (
          <Link
            key={id}
            to={`/ad/${id}`}
            onClick={() => {
              sessionStorage.setItem("ad_preview", JSON.stringify(ad));
            }}
            className="card p-2 hover:shadow transition flex flex-col"
          >
            <img
              src={imgUrl}
              alt={ad.title}
              className="w-full h-36 object-contain rounded-md mb-2 bg-white"
            />
            <div className="font-semibold text-sm line-clamp-2">{ad.title}</div>
            <div className="text-accent font-bold">{ad.price || "—"}</div>
            <div className="text-xs text-slate-500">{ad.location || ""}</div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="container-x py-8 space-y-6">
      <div className="card p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
          👤
        </div>
        <div className="flex-1">
          <div className="badge mb-1">Личный кабинет</div>
          <h1 className="text-2xl font-bold">{me?.name || "Без имени"}</h1>
          <div className="text-slate-600">{me?.email}</div>
          {me?.phone && <div className="text-slate-600">{me.phone}</div>}
        </div>
        <div className="flex gap-2">
          <Link to="/add" className="btn btn-primary">
            Добавить объявление
          </Link>
          <button className="btn" onClick={logout}>
            Выйти
          </button>
        </div>
      </div>

      <div className="card p-3">
        <div className="flex items-center gap-2">
          <button
            className={`btn ${tab === "profile" ? "btn-primary" : ""}`}
            onClick={() => setTab("profile")}
          >
            Профиль
          </button>
          <button
            className={`btn ${tab === "my" ? "btn-primary" : ""}`}
            onClick={() => setTab("my")}
          >
            Мои объявления
          </button>
          <button
            className={`btn ${tab === "fav" ? "btn-primary" : ""}`}
            onClick={() => setTab("fav")}
          >
            Избранное
          </button>

          {/* небольшой индикатор автосохранения */}
          {tab === "profile" && (
            <span className="ml-auto text-sm text-slate-500">
              {saving ? "Сохраняю…" : msg ? "Сохранено" : ""}
            </span>
          )}
        </div>
      </div>

      {tab === "profile" && (
        <>
          {(err || (msg && !saving)) && (
            <div className="card p-3">
              {err ? (
                <div className="text-red-600">{err}</div>
              ) : (
                <div className="text-emerald-600">{msg}</div>
              )}
            </div>
          )}

          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-3">Настройки профиля</h2>
            <form
              onSubmit={save}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <label className="block">
                <div className="text-sm font-medium mb-1">Имя</div>
                <input
                  className="input w-full"
                  value={form.name}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, name: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                <div className="text-sm font-medium mb-1">Email</div>
                <input
                  className="input w-full"
                  type="email"
                  value={form.email}
                  readOnly
                />
              </label>
              <label className="block">
                <div className="text-sm font-medium mb-1">Телефон</div>
                <input
                  className="input w-full"
                  placeholder="+992 ..."
                  value={form.phone}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, phone: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                <div className="text-sm font-medium mb-1">Тип продавца</div>
                <select
                  className="select w-full"
                  value={form.sellerType}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, sellerType: e.target.value }))
                  }
                >
                  <option value="private">Частник</option>
                  <option value="company">Компания</option>
                </select>
              </label>
              <div className="md:col-span-2">
                <button className="btn btn-primary">Сохранить</button>
              </div>
            </form>
          </div>
        </>
      )}

      {tab === "my" && (
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-3">Мои объявления</h2>
          {myItems.length === 0 ? (
            <div className="text-slate-600">У вас пока нет объявлений.</div>
          ) : (
            <Grid items={myItems} />
          )}
        </div>
      )}

      {tab === "fav" && (
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-3">Избранное</h2>
          {favItems.length === 0 ? (
            <div className="text-slate-600">Список избранного пуст.</div>
          ) : (
            <Grid items={favItems} />
          )}
        </div>
      )}
    </div>
  );
}
