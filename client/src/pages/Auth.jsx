import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

const Input = (props) => (
  <input {...props} className={`input w-full ${props.className || ""}`} />
);
const Label = ({ children }) => (
  <label className="text-sm font-medium">{children}</label>
);
const ErrorText = ({ children }) =>
  children ? <div className="text-red-600 text-sm">{children}</div> : null;

export default function Auth() {
  const nav = useNavigate();
  const [tab, setTab] = React.useState("login");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [ok, setOk] = React.useState("");

  const [login, setLogin] = React.useState({ email: "", password: "" });
  const [reg, setReg] = React.useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    agree: false,
  });

  const onLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setLoading(true);
    try {
      if (!login.email || !login.password)
        throw new Error("Заполните email и пароль");
      const { token, user } = await api.login({
        email: login.email.trim(),
        password: login.password,
      });
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setOk("Вход выполнен!");
      nav("/profile");
    } catch (e) {
      setErr(e.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setLoading(true);
    try {
      if (!reg.name || !reg.email || !reg.password || !reg.confirm)
        throw new Error("Заполните все поля");
      if (reg.password.length < 6)
        throw new Error("Пароль должен быть не короче 6 символов");
      if (reg.password !== reg.confirm) throw new Error("Пароли не совпадают");
      if (!reg.agree) throw new Error("Подтвердите согласие с политикой сайта");
      await api.register({
        name: reg.name.trim(),
        email: reg.email.trim(),
        password: reg.password,
      });
      setOk("Аккаунт создан! Теперь войдите.");
      setTab("login");
      setLogin({ email: reg.email, password: "" });
      setReg({ name: "", email: "", password: "", confirm: "", agree: false });
    } catch (e) {
      setErr(e.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  const strength = React.useMemo(() => {
    let s = 0;
    if (reg.password.length >= 6) s++;
    if (/[A-ZА-Я]/.test(reg.password)) s++;
    if (/[0-9]/.test(reg.password)) s++;
    if (/[^A-Za-zА-Яа-я0-9]/.test(reg.password)) s++;
    return s;
  }, [reg.password]);

  return (
    <div className="container-x py-6">
      <div className="max-w-lg mx-auto card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">
            {tab === "login" ? "Вход" : "Регистрация"}
          </h1>
          <div className="flex gap-2">
            <button
              className={`btn ${tab === "login" ? "btn-primary" : ""}`}
              onClick={() => setTab("login")}
            >
              Вход
            </button>
            <button
              className={`btn ${tab === "register" ? "btn-primary" : ""}`}
              onClick={() => setTab("register")}
            >
              Регистрация
            </button>
          </div>
        </div>

        {err && <ErrorText>{err}</ErrorText>}
        {ok && <div className="text-emerald-600 text-sm">{ok}</div>}

        {tab === "login" && (
          <form onSubmit={onLogin} className="space-y-2">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="you@mail.tj"
                value={login.email}
                onChange={(e) =>
                  setLogin((v) => ({ ...v, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Пароль</Label>
              <Input
                type="password"
                placeholder="••••••"
                value={login.password}
                onChange={(e) =>
                  setLogin((v) => ({ ...v, password: e.target.value }))
                }
                required
              />
            </div>
            <button className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Входим…" : "Войти"}
            </button>
          </form>
        )}

        {tab === "register" && (
          <form onSubmit={onRegister} className="space-y-2">
            <div className="space-y-1">
              <Label>Имя</Label>
              <Input
                placeholder="Как к вам обращаться"
                value={reg.name}
                onChange={(e) =>
                  setReg((v) => ({ ...v, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="you@mail.tj"
                value={reg.email}
                onChange={(e) =>
                  setReg((v) => ({ ...v, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Пароль</Label>
                <Input
                  type="password"
                  placeholder="минимум 6 символов"
                  value={reg.password}
                  onChange={(e) =>
                    setReg((v) => ({ ...v, password: e.target.value }))
                  }
                  required
                />
                <div className="h-1 bg-slate-200 rounded">
                  <div
                    className={`h-1 rounded ${
                      [
                        "bg-red-400",
                        "bg-yellow-400",
                        "bg-lime-500",
                        "bg-emerald-600",
                      ][Math.max(0, strength - 1)] || "bg-red-400"
                    }`}
                    style={{ width: `${(strength / 4) * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Повтор пароля</Label>
                <Input
                  type="password"
                  placeholder="••••••"
                  value={reg.confirm}
                  onChange={(e) =>
                    setReg((v) => ({ ...v, confirm: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={reg.agree}
                onChange={(e) =>
                  setReg((v) => ({ ...v, agree: e.target.checked }))
                }
                required
              />
              Я согласен с{" "}
              <a
                href="/policy"
                className="text-accent underline"
                onClick={(e) => e.stopPropagation()}
              >
                политикой сайта
              </a>
            </label>

            <button
              className="btn btn-primary w-full"
              disabled={loading || !reg.agree}
            >
              {loading ? "Создаём…" : "Зарегистрироваться"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
