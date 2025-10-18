import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export default function Header() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [q, setQ] = React.useState(sp.get("q") || "");
  const [cat, setCat] = React.useState(sp.get("cat") || "");

  const session = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("auth_user") || "null");
    } catch {
      return null;
    }
  }, []);

  const go = () =>
    nav(`/listing?q=${encodeURIComponent(q)}&cat=${encodeURIComponent(cat)}`);

  const addHref = session ? "/add" : "/auth";

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="container-x py-2 flex items-center justify-between gap-3 flex-wrap">
        {/* Лого */}
        <Link
          to="/"
          className="flex items-center gap-2 font-extrabold text-brand text-lg"
        >
          <span className="bg-brand text-white px-2.5 py-1 rounded-lg">
            Oriyon
          </span>
          .store
        </Link>

        {/* Поиск */}
        <div className="flex-1 hidden md:flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 card px-3 py-2">
            <input
              className="flex-1 outline-none bg-transparent"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()}
              placeholder="Поиск объявлений..."
            />
            <select
              className="select"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            >
              <option value="">Все категории</option>
              <option value="transport">Авто</option>
              <option value="furniture">Мебель</option>
              <option value="phones">Телефоны</option>
              <option value="electronics">Бытовая техника</option>
              <option value="computers">Компьютеры и оргтехника</option>
              <option value="repair">Ремонт</option>
            </select>
            <button onClick={go} className="btn btn-primary">
              Найти
            </button>
          </div>
        </div>

        {/* Справа */}
        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            className="btn flex items-center gap-2"
            title="Избранное"
          >
            <span className="text-rose-500">♥</span>
            <span className="hidden sm:inline">Избранное</span>
          </Link>

          <Link
            to={addHref}
            className="btn btn-primary flex items-center gap-2"
            title="Добавить объявление"
          >
            <span className="text-white text-lg">＋</span>
            <span className="hidden sm:inline text-white">Добавить</span>
          </Link>

          {session ? (
            <Link to="/profile" className="btn" title="Личный кабинет">
              Профиль
            </Link>
          ) : (
            <Link to="/auth" className="btn" title="Войти">
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
