import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Keyboard,
  Loader2,
} from "lucide-react";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// === Универсальный компонент поля ===
const Field = ({ label, hint, icon: Icon, right, children }) => (
  <div className="space-y-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <div className="relative">
      {Icon && (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Icon size={18} />
        </span>
      )}
      {children}
      {right && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-3">{right}</span>
      )}
    </div>
    {hint}
  </div>
);

const Input = React.forwardRef(function Input(
  { className = "", leftIcon, right, ...props },
  ref
) {
  return (
    <div className="relative">
      {leftIcon}
      <input
        ref={ref}
        {...props}
        className={[
          "w-full h-11 rounded-lg border bg-white px-3 text-[15px] leading-none",
          "placeholder:text-slate-400",
          "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors",
          leftIcon ? "pl-11" : "",
          right ? "pr-11" : "",
          className,
        ].join(" ")}
      />
      {right}
    </div>
  );
});

const Alert = ({ type = "error", children }) => {
  if (!children) return null;
  const styles =
    type === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-red-50 text-red-700 border-red-200";
  const Icon = type === "success" ? CheckCircle2 : AlertTriangle;
  return (
    <div className={`flex items-start gap-2 rounded-lg border p-3 ${styles}`}>
      <Icon size={18} className="mt-0.5" />
      <div className="text-sm">{children}</div>
    </div>
  );
};

// === Основной компонент ===
export default function Auth() {
  const nav = useNavigate();
  const [tab, setTab] = React.useState("login");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [ok, setOk] = React.useState("");

  const emailRef = React.useRef(null);

  const [login, setLogin] = React.useState({ email: "", password: "" });
  const [reg, setReg] = React.useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    agree: false,
  });

  const [showPassLogin, setShowPassLogin] = React.useState(false);
  const [showPassReg, setShowPassReg] = React.useState(false);
  const [showPassReg2, setShowPassReg2] = React.useState(false);

  const [capsLogin, setCapsLogin] = React.useState(false);
  const [capsReg1, setCapsReg1] = React.useState(false);
  const [capsReg2, setCapsReg2] = React.useState(false);

  React.useEffect(() => {
    emailRef.current?.focus();
  }, [tab]);

  const onLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setLoading(true);
    try {
      if (!login.email || !login.password) throw new Error("Заполните email и пароль");
      const { token, user } = await api.login({
        email: login.email.trim(),
        password: login.password,
      });
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setOk("Вход выполнен! Перенаправляем…");
      setTimeout(() => nav("/profile"), 300);
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
    if (!reg.name || !reg.email || !reg.password || !reg.confirm) {
      throw new Error("Заполните все поля");
    }

    if (!/^\S+@\S+\.\S+$/.test(reg.email.trim())) {
      throw new Error("Некорректный email");
    }

    if (reg.password.length < 6) {
      throw new Error("Пароль должен быть не короче 6 символов");
    }

    if (reg.password !== reg.confirm) {
      throw new Error("Пароли не совпадают");
    }

    if (!reg.agree) {
      throw new Error("Подтвердите согласие с политикой сайта");
    }

    const { token, user } = await api.register({
      name: reg.name.trim(),
      email: reg.email.trim(),
      password: reg.password,
    });

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    setOk("Аккаунт создан! Перенаправляем…");

    setTimeout(() => nav("/profile"), 300);
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

  const loginValid = login.email && login.password;
  const regValid =
    reg.name &&
    /^\S+@\S+\.\S+$/.test(reg.email.trim()) &&
    reg.password.length >= 6 &&
    reg.password === reg.confirm &&
    reg.agree;

  // === стиль кнопок ===
  const buttonStyle = `
    w-full h-11 rounded-xl font-medium text-white transition-all
    bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700
    shadow-md hover:shadow-lg hover:from-blue-500 hover:to-blue-600
    active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
  `;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50/80 border-b px-2 py-2">
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white border">
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  tab === "login"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "hover:bg-slate-50"
                }`}
                onClick={() => setTab("login")}
              >
                Вход
              </button>
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  tab === "register"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "hover:bg-slate-50"
                }`}
                onClick={() => setTab("register")}
              >
                Регистрация
              </button>
            </div>
          </div>

          {/* === Форма === */}
          <div className="p-5 space-y-4">
            <Alert type="error">{err}</Alert>
            <Alert type="success">{ok}</Alert>

            {/* === ВХОД === */}
            {tab === "login" && (
              <form onSubmit={onLogin} className="space-y-4">
                <Field label="Email" icon={Mail}>
                  <Input
                    ref={emailRef}
                    type="email"
                    placeholder="you@mail.tj"
                    value={login.email}
                    onChange={(e) => setLogin((v) => ({ ...v, email: e.target.value }))}
                    autoComplete="email"
                  />
                </Field>

                <Field label="Пароль" icon={Lock}>
                  <Input
                    type={showPassLogin ? "text" : "password"}
                    placeholder="••••••"
                    value={login.password}
                    onChange={(e) => setLogin((v) => ({ ...v, password: e.target.value }))}
                    onKeyUp={(e) => setCapsLogin(e.getModifierState?.("CapsLock"))}
                    autoComplete="current-password"
                    right
                  />
                  {capsLogin && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                      <Keyboard size={14} /> Включён CapsLock
                    </div>
                  )}
                </Field>

                <button
                  className={buttonStyle}
                  disabled={loading || !loginValid}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      Входим…
                    </span>
                  ) : (
                    "Войти"
                  )}
                </button>
              </form>
            )}

            {/* === РЕГИСТРАЦИЯ === */}
            {tab === "register" && (
              <form onSubmit={onRegister} className="space-y-4">
                <Field label="Имя" icon={UserIcon}>
                  <Input
                    placeholder="Как к вам обращаться"
                    value={reg.name}
                    onChange={(e) => setReg((v) => ({ ...v, name: e.target.value }))}
                    autoComplete="name"
                  />
                </Field>

                <Field label="Email" icon={Mail}>
                  <Input
                    type="email"
                    placeholder="you@mail.tj"
                    value={reg.email}
                    onChange={(e) => setReg((v) => ({ ...v, email: e.target.value }))}
                    autoComplete="email"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Пароль" icon={Lock}>
                    <Input
                      type={showPassReg ? "text" : "password"}
                      placeholder="минимум 6 символов"
                      value={reg.password}
                      onChange={(e) => setReg((v) => ({ ...v, password: e.target.value }))}
                      autoComplete="new-password"
                      right
                    />
                    <div className="h-1 bg-slate-200 rounded mt-2">
                      <div
                        className={`h-1 rounded transition-all ${
                          ["bg-red-400", "bg-yellow-400", "bg-lime-500", "bg-emerald-600"][
                            Math.max(0, strength - 1)
                          ] || "bg-red-400"
                        }`}
                        style={{ width: `${(strength / 4) * 100}%` }}
                      />
                    </div>
                  </Field>

                  <Field label="Повтор пароля" icon={Lock}>
                    <Input
                      type={showPassReg2 ? "text" : "password"}
                      placeholder="••••••"
                      value={reg.confirm}
                      onChange={(e) => setReg((v) => ({ ...v, confirm: e.target.value }))}
                      autoComplete="new-password"
                      right
                    />
                    {reg.confirm && reg.password !== reg.confirm && (
                      <div className="text-xs text-red-600 mt-1">Пароли не совпадают</div>
                    )}
                  </Field>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={reg.agree}
                    onChange={(e) => setReg((v) => ({ ...v, agree: e.target.checked }))}
                    className="rounded border-slate-300"
                    required
                  />
                  Я согласен с{" "}
                  <a href="/policy" className="text-accent underline">
                    политикой сайта
                  </a>
                </label>

                <button
                  className={buttonStyle}
                  disabled={loading || !regValid}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      Создаём…
                    </span>
                  ) : (
                    "Зарегистрироваться"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-slate-600">
          {tab === "login" ? (
            <>
              Нет аккаунта?{" "}
              <button className="text-accent underline" onClick={() => setTab("register")}>
                Зарегистрируйтесь
              </button>
            </>
          ) : (
            <>
              Уже есть аккаунт?{" "}
              <button className="text-accent underline" onClick={() => setTab("login")}>
                Войдите
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
