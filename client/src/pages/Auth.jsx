import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { TOKEN_KEY, USER_KEY } from "../lib/auth";
import { BUSINESS_BENEFITS } from "../lib/businessAccount";
import AuthTrustPanel from "../components/auth/AuthTrustPanel";
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
  Building2,
} from "lucide-react";

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
  { className = "", withIcon, withToggle, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      {...props}
      className={[
        "w-full h-11 rounded-xl border border-ink/15 bg-white px-3 text-[15px] leading-none",
        "placeholder:text-ink-300",
        "focus:ring-2 focus:ring-sun/40 focus:border-sun transition-colors",
        withIcon ? "pl-11" : "",
        withToggle ? "pr-11" : "",
        className,
      ].join(" ")}
    />
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
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="text-sm">{children}</div>
    </div>
  );
};

function PasswordToggle({ visible, onToggle, label }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-slate-400 hover:text-slate-600 transition"
      aria-label={visible ? `Скрыть ${label}` : `Показать ${label}`}
    >
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}

function accountTypeClass(active) {
  return active
    ? "border-sun bg-sun text-white shadow-sm"
    : "border-slate-200 bg-white text-slate-700 hover:border-sun/40";
}

function getAuthSubtitle(returnTo) {
  const path = String(returnTo || "").toLowerCase();

  if (path.includes("fav")) return "Войдите, чтобы сохранять объявления в избранное";
  if (path.includes("/add") || path.includes("edit")) {
    return "Войдите, чтобы подать или редактировать объявление";
  }
  if (path.includes("messages")) return "Войдите, чтобы писать продавцам и покупателям";
  if (path.includes("profile?tab=promote")) return "Войдите, чтобы продвинуть объявление";
  if (path.includes("wallet")) return "Войдите, чтобы пополнить кошелёк";

  return "Войдите, чтобы управлять объявлениями";
}

export default function Auth() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/profile";
  const urlTab = searchParams.get("tab") === "register" ? "register" : "login";

  const redirectAfterAuth = React.useCallback(() => {
    nav(returnTo.startsWith("/") ? returnTo : "/profile", { replace: true });
  }, [nav, returnTo]);

  const [tab, setTab] = React.useState(urlTab);
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
    sellerType: "private",
    companyName: "",
  });

  const [showPassLogin, setShowPassLogin] = React.useState(false);
  const [showPassReg, setShowPassReg] = React.useState(false);
  const [showPassReg2, setShowPassReg2] = React.useState(false);

  const [capsLogin, setCapsLogin] = React.useState(false);
  const [registrationEnabled, setRegistrationEnabled] = React.useState(true);

  React.useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY)) {
      redirectAfterAuth();
    }
  }, [redirectAfterAuth]);

  React.useEffect(() => {
    setTab(urlTab);
  }, [urlTab]);

  React.useEffect(() => {
    api
      .siteSettings()
      .then((data) => {
        setRegistrationEnabled(Boolean(data.registrationEnabled));
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    emailRef.current?.focus();
  }, [tab]);

  React.useEffect(() => {
    if (!registrationEnabled && tab === "register") {
      switchTab("login");
    }
  }, [registrationEnabled, tab]);

  const switchTab = React.useCallback(
    (nextTab) => {
      setTab(nextTab);
      setErr("");
      setOk("");

      const params = new URLSearchParams(searchParams);
      params.set("tab", nextTab);
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const onLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setLoading(true);

    try {
      if (!login.email || !login.password) {
        throw new Error("Заполните email и пароль");
      }

      const { token, user } = await api.login({
        email: login.email.trim(),
        password: login.password,
      });

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setOk("Вход выполнен! Перенаправляем…");
      setTimeout(() => redirectAfterAuth(), 300);
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

      if (reg.sellerType === "company" && !reg.companyName.trim()) {
        throw new Error("Укажите название компании");
      }

      const { token, user } = await api.register({
        name: reg.name.trim(),
        email: reg.email.trim(),
        password: reg.password,
        sellerType: reg.sellerType,
        companyName: reg.companyName.trim(),
      });

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setOk("Аккаунт создан! Перенаправляем…");
      setTimeout(() => redirectAfterAuth(), 300);
    } catch (e) {
      setErr(e.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  const strength = React.useMemo(() => {
    let score = 0;
    if (reg.password.length >= 6) score++;
    if (/[A-ZА-Я]/.test(reg.password)) score++;
    if (/[0-9]/.test(reg.password)) score++;
    if (/[^A-Za-zА-Яа-я0-9]/.test(reg.password)) score++;
    return score;
  }, [reg.password]);

  const subtitle = getAuthSubtitle(returnTo);

  return (
    <div className="container-x flex min-h-[calc(100vh-4rem)] items-center py-8 lg:py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="w-full max-w-xl mx-auto lg:max-w-none lg:mx-0">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {tab === "login" ? "Добро пожаловать" : "Создайте аккаунт"}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-500">{subtitle}</p>
          </div>

          <div className="surface-panel overflow-hidden">
            <div className="bg-mist-50 border-b border-ink/10 px-2 py-2">
              <div
                className={`grid gap-2 p-1 rounded-xl bg-white border border-ink/10 ${
                  registrationEnabled ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
                <button
                  type="button"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    tab === "login"
                      ? "bg-sun text-white shadow-soft"
                      : "hover:bg-mist text-ink-500"
                  }`}
                  onClick={() => switchTab("login")}
                >
                  Вход
                </button>
                {registrationEnabled && (
                  <button
                    type="button"
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                      tab === "register"
                        ? "bg-sun text-white shadow-soft"
                        : "hover:bg-mist text-ink-500"
                    }`}
                    onClick={() => switchTab("register")}
                  >
                    Регистрация
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <Alert type="error">{err}</Alert>
              <Alert type="success">{ok}</Alert>

              {tab === "login" && (
                <form onSubmit={onLogin} className="space-y-4">
                  <Field label="Email" icon={Mail}>
                    <Input
                      ref={emailRef}
                      type="email"
                      placeholder="you@mail.tj"
                      value={login.email}
                      onChange={(e) =>
                        setLogin((value) => ({ ...value, email: e.target.value }))
                      }
                      autoComplete="email"
                      withIcon
                    />
                  </Field>

                  <Field
                    label="Пароль"
                    icon={Lock}
                    right={
                      <PasswordToggle
                        visible={showPassLogin}
                        onToggle={() => setShowPassLogin((value) => !value)}
                        label="пароль"
                      />
                    }
                  >
                    <Input
                      type={showPassLogin ? "text" : "password"}
                      placeholder="••••••"
                      value={login.password}
                      onChange={(e) =>
                        setLogin((value) => ({ ...value, password: e.target.value }))
                      }
                      onKeyUp={(e) => setCapsLogin(e.getModifierState?.("CapsLock"))}
                      autoComplete="current-password"
                      withIcon
                      withToggle
                    />
                    {capsLogin && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                        <Keyboard size={14} /> Включён Caps Lock
                      </div>
                    )}
                  </Field>

                  <button
                    type="submit"
                    className="btn btn-primary w-full h-11 rounded-xl font-semibold shadow-soft hover:shadow-lift active:scale-[0.98] disabled:opacity-60"
                    disabled={loading}
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

              {tab === "register" && registrationEnabled && (
                <form onSubmit={onRegister} className="space-y-4">
                  <Field label="Имя" icon={UserIcon}>
                    <Input
                      placeholder="Как к вам обращаться"
                      value={reg.name}
                      onChange={(e) =>
                        setReg((value) => ({ ...value, name: e.target.value }))
                      }
                      autoComplete="name"
                      withIcon
                    />
                  </Field>

                  <Field label="Email" icon={Mail}>
                    <Input
                      type="email"
                      placeholder="you@mail.tj"
                      value={reg.email}
                      onChange={(e) =>
                        setReg((value) => ({ ...value, email: e.target.value }))
                      }
                      autoComplete="email"
                      withIcon
                    />
                  </Field>

                  <div className="space-y-3">
                    <div className="text-sm font-medium text-slate-700">Тип аккаунта</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setReg((value) => ({ ...value, sellerType: "private" }))
                        }
                        className={`rounded-xl border px-4 py-3 text-left transition ${accountTypeClass(
                          reg.sellerType === "private"
                        )}`}
                      >
                        <div className="font-semibold inline-flex items-center gap-2">
                          <UserIcon size={16} />
                          Частное лицо
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setReg((value) => ({
                            ...value,
                            sellerType: "company",
                            companyName: value.companyName || value.name,
                          }))
                        }
                        className={`rounded-xl border px-4 py-3 text-left transition ${accountTypeClass(
                          reg.sellerType === "company"
                        )}`}
                      >
                        <div className="font-semibold inline-flex items-center gap-2">
                          <Building2 size={16} />
                          Компания
                        </div>
                      </button>
                    </div>

                    {reg.sellerType === "company" && (
                      <>
                        <Field label="Название компании" icon={Building2}>
                          <Input
                            placeholder="Oriyon Estate"
                            value={reg.companyName}
                            onChange={(e) =>
                              setReg((value) => ({
                                ...value,
                                companyName: e.target.value,
                              }))
                            }
                            withIcon
                          />
                        </Field>
                        <ul className="grid gap-2 sm:grid-cols-3">
                          {BUSINESS_BENEFITS.slice(0, 3).map((item) => (
                            <li
                              key={item}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                      label="Пароль"
                      icon={Lock}
                      right={
                        <PasswordToggle
                          visible={showPassReg}
                          onToggle={() => setShowPassReg((value) => !value)}
                          label="пароль"
                        />
                      }
                    >
                      <Input
                        type={showPassReg ? "text" : "password"}
                        placeholder="минимум 6 символов"
                        value={reg.password}
                        onChange={(e) =>
                          setReg((value) => ({ ...value, password: e.target.value }))
                        }
                        autoComplete="new-password"
                        withIcon
                        withToggle
                      />
                      <div className="h-1 bg-slate-200 rounded mt-2 overflow-hidden">
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

                    <Field
                      label="Повтор пароля"
                      icon={Lock}
                      right={
                        <PasswordToggle
                          visible={showPassReg2}
                          onToggle={() => setShowPassReg2((value) => !value)}
                          label="повтор пароля"
                        />
                      }
                    >
                      <Input
                        type={showPassReg2 ? "text" : "password"}
                        placeholder="••••••"
                        value={reg.confirm}
                        onChange={(e) =>
                          setReg((value) => ({ ...value, confirm: e.target.value }))
                        }
                        autoComplete="new-password"
                        withIcon
                        withToggle
                      />
                      {reg.confirm && reg.password !== reg.confirm && (
                        <div className="text-xs text-red-600 mt-1">Пароли не совпадают</div>
                      )}
                      {reg.confirm && reg.password === reg.confirm && reg.confirm.length > 0 && (
                        <div className="text-xs text-emerald-600 mt-1">Пароли совпадают</div>
                      )}
                    </Field>
                  </div>

                  <label className="flex items-start gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={reg.agree}
                      onChange={(e) =>
                        setReg((value) => ({ ...value, agree: e.target.checked }))
                      }
                      className="mt-0.5 rounded border-slate-300 accent-sun"
                    />
                    <span>
                      Я согласен с{" "}
                      <Link to="/policy" className="text-sun font-medium hover:underline">
                        политикой сайта
                      </Link>
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="btn btn-primary w-full h-11 rounded-xl font-semibold shadow-soft hover:shadow-lift active:scale-[0.98] disabled:opacity-60"
                    disabled={loading}
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
              registrationEnabled ? (
                <>
                  Нет аккаунта?{" "}
                  <button
                    type="button"
                    className="text-sun font-medium hover:underline"
                    onClick={() => switchTab("register")}
                  >
                    Зарегистрируйтесь
                  </button>
                </>
              ) : null
            ) : (
              <>
                Уже есть аккаунт?{" "}
                <button
                  type="button"
                  className="text-sun font-medium hover:underline"
                  onClick={() => switchTab("login")}
                >
                  Войдите
                </button>
              </>
            )}
          </div>
        </div>

        <AuthTrustPanel />
      </div>
    </div>
  );
}
