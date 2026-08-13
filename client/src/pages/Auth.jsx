import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { TOKEN_KEY, USER_KEY } from "../lib/auth";
import AuthTrustPanel from "../components/auth/AuthTrustPanel";
import {
  formatPhoneLocalDigits,
  isValidPhoneDigits,
  phoneDigitsToApi,
} from "../lib/phoneUtils";
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
  Phone,
  ArrowLeft,
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
  const [authMethod, setAuthMethod] = React.useState("phone");
  const [phoneStep, setPhoneStep] = React.useState("phone");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [ok, setOk] = React.useState("");

  const emailRef = React.useRef(null);
  const phoneRef = React.useRef(null);
  const codeRef = React.useRef(null);

  const [phoneDigits, setPhoneDigits] = React.useState("");
  const [phoneCode, setPhoneCode] = React.useState("");
  const [phoneName, setPhoneName] = React.useState("");
  const [phoneAgree, setPhoneAgree] = React.useState(false);
  const [phoneDisplay, setPhoneDisplay] = React.useState("");
  const [resendSec, setResendSec] = React.useState(0);
  const [devCodeHint, setDevCodeHint] = React.useState("");

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
    if (authMethod === "phone") {
      if (phoneStep === "code") {
        codeRef.current?.focus();
      } else {
        phoneRef.current?.focus();
      }
      return;
    }

    emailRef.current?.focus();
  }, [tab, authMethod, phoneStep]);

  React.useEffect(() => {
    if (resendSec <= 0) return undefined;

    const timer = window.setInterval(() => {
      setResendSec((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendSec]);

  const resetPhoneFlow = React.useCallback(() => {
    setPhoneStep("phone");
    setPhoneCode("");
    setPhoneName("");
    setPhoneAgree(false);
    setPhoneDisplay("");
    setResendSec(0);
    setDevCodeHint("");
  }, []);

  const switchAuthMethod = React.useCallback(
    (method) => {
      setAuthMethod(method);
      setErr("");
      setOk("");
      resetPhoneFlow();
    },
    [resetPhoneFlow]
  );

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
      resetPhoneFlow();

      const params = new URLSearchParams(searchParams);
      params.set("tab", nextTab);
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams, resetPhoneFlow]
  );

  const persistAuth = React.useCallback(
    ({ token, user }) => {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setOk(tab === "login" ? "Вход выполнен! Перенаправляем…" : "Аккаунт создан! Перенаправляем…");
      window.setTimeout(() => redirectAfterAuth(), 300);
    },
    [redirectAfterAuth, tab]
  );

  const onSendPhoneCode = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setDevCodeHint("");

    if (!isValidPhoneDigits(phoneDigits)) {
      setErr("Введите номер в формате 90 123 45 67");
      return;
    }

    setLoading(true);

    try {
      const data = await api.sendPhoneCode({
        phone: phoneDigitsToApi(phoneDigits),
        mode: tab,
      });

      setPhoneDisplay(data.phoneDisplay || phoneDigitsToApi(phoneDigits));
      setPhoneStep("code");
      setResendSec(Number(data.retryAfterSec) || 60);

      if (data.devCode) {
        setDevCodeHint(`Код для разработки: ${data.devCode}`);
      }

      setOk(`Код отправлен на ${data.phoneDisplay || phoneDigitsToApi(phoneDigits)}`);
    } catch (e) {
      setErr(e.message || "Не удалось отправить код");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPhoneCode = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!/^\d{6}$/.test(phoneCode)) {
      setErr("Введите 6-значный код из SMS");
      return;
    }

    if (tab === "register" && !phoneName.trim()) {
      setErr("Укажите, как к вам обращаться");
      return;
    }

    if (tab === "register" && !phoneAgree) {
      setErr("Подтвердите согласие с политикой сайта");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        phone: phoneDigitsToApi(phoneDigits),
        code: phoneCode,
        mode: tab,
      };

      if (tab === "register") {
        payload.name = phoneName.trim();
      }

      const { token, user } = await api.verifyPhoneCode(payload);
      persistAuth({ token, user });
    } catch (e) {
      setErr(e.message || "Не удалось подтвердить код");
    } finally {
      setLoading(false);
    }
  };

  const onResendPhoneCode = async () => {
    if (resendSec > 0 || loading) return;

    setErr("");
    setOk("");
    setDevCodeHint("");
    setLoading(true);

    try {
      const data = await api.sendPhoneCode({
        phone: phoneDigitsToApi(phoneDigits),
        mode: tab,
      });

      setResendSec(Number(data.retryAfterSec) || 60);

      if (data.devCode) {
        setDevCodeHint(`Код для разработки: ${data.devCode}`);
      }

      setOk("Новый код отправлен");
    } catch (e) {
      setErr(e.message || "Не удалось отправить код");
    } finally {
      setLoading(false);
    }
  };

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

      persistAuth({ token, user });
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

      persistAuth({ token, user });
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
              {devCodeHint && authMethod === "phone" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {devCodeHint}
                </div>
              )}

              {authMethod === "phone" && tab === "login" && (
                <>
                  {phoneStep === "phone" ? (
                    <form onSubmit={onSendPhoneCode} className="space-y-4">
                      <Field label="Номер телефона" icon={Phone}>
                        <div className="flex">
                          <span className="inline-flex h-11 items-center rounded-l-xl border border-r-0 border-ink/15 bg-mist-50 px-3 text-sm font-semibold text-ink-600">
                            +992
                          </span>
                          <Input
                            ref={phoneRef}
                            type="tel"
                            inputMode="numeric"
                            placeholder="90 123 45 67"
                            value={formatPhoneLocalDigits(phoneDigits)}
                            onChange={(e) =>
                              setPhoneDigits(
                                e.target.value.replace(/\D/g, "").slice(0, 9)
                              )
                            }
                            autoComplete="tel"
                            className="rounded-l-none"
                          />
                        </div>
                      </Field>

                      <button
                        type="submit"
                        className="btn btn-primary w-full h-11 rounded-xl font-semibold shadow-soft hover:shadow-lift active:scale-[0.98] disabled:opacity-60"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin" size={18} />
                            Отправляем…
                          </span>
                        ) : (
                          "Получить код"
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={onVerifyPhoneCode} className="space-y-4">
                      <button
                        type="button"
                        onClick={resetPhoneFlow}
                        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
                      >
                        <ArrowLeft size={16} />
                        Изменить номер
                      </button>

                      <p className="text-sm text-slate-600">
                        Код отправлен на{" "}
                        <span className="font-semibold text-slate-900">
                          {phoneDisplay || phoneDigitsToApi(phoneDigits)}
                        </span>
                      </p>

                      <Field label="Код из SMS" icon={Lock}>
                        <Input
                          ref={codeRef}
                          type="text"
                          inputMode="numeric"
                          placeholder="123456"
                          value={phoneCode}
                          onChange={(e) =>
                            setPhoneCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          autoComplete="one-time-code"
                          withIcon
                        />
                      </Field>

                      <button
                        type="submit"
                        className="btn btn-primary w-full h-11 rounded-xl font-semibold shadow-soft hover:shadow-lift active:scale-[0.98] disabled:opacity-60"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin" size={18} />
                            Проверяем…
                          </span>
                        ) : (
                          "Войти"
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={onResendPhoneCode}
                        disabled={resendSec > 0 || loading}
                        className="w-full text-sm text-sun font-medium hover:underline disabled:text-slate-400 disabled:no-underline"
                      >
                        {resendSec > 0
                          ? `Отправить код повторно через ${resendSec} сек`
                          : "Отправить код повторно"}
                      </button>
                    </form>
                  )}
                </>
              )}

              {authMethod === "phone" && tab === "register" && registrationEnabled && (
                <>
                  {phoneStep === "phone" ? (
                    <form onSubmit={onSendPhoneCode} className="space-y-4">
                      <Field label="Номер телефона" icon={Phone}>
                        <div className="flex">
                          <span className="inline-flex h-11 items-center rounded-l-xl border border-r-0 border-ink/15 bg-mist-50 px-3 text-sm font-semibold text-ink-600">
                            +992
                          </span>
                          <Input
                            ref={phoneRef}
                            type="tel"
                            inputMode="numeric"
                            placeholder="90 123 45 67"
                            value={formatPhoneLocalDigits(phoneDigits)}
                            onChange={(e) =>
                              setPhoneDigits(
                                e.target.value.replace(/\D/g, "").slice(0, 9)
                              )
                            }
                            autoComplete="tel"
                            className="rounded-l-none"
                          />
                        </div>
                      </Field>

                      <button
                        type="submit"
                        className="btn btn-primary w-full h-11 rounded-xl font-semibold shadow-soft hover:shadow-lift active:scale-[0.98] disabled:opacity-60"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin" size={18} />
                            Отправляем…
                          </span>
                        ) : (
                          "Получить код"
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={onVerifyPhoneCode} className="space-y-4">
                      <button
                        type="button"
                        onClick={resetPhoneFlow}
                        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
                      >
                        <ArrowLeft size={16} />
                        Изменить номер
                      </button>

                      <p className="text-sm text-slate-600">
                        Код отправлен на{" "}
                        <span className="font-semibold text-slate-900">
                          {phoneDisplay || phoneDigitsToApi(phoneDigits)}
                        </span>
                      </p>

                      <Field label="Код из SMS" icon={Lock}>
                        <Input
                          ref={codeRef}
                          type="text"
                          inputMode="numeric"
                          placeholder="123456"
                          value={phoneCode}
                          onChange={(e) =>
                            setPhoneCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          autoComplete="one-time-code"
                          withIcon
                        />
                      </Field>

                      <Field label="ФИО" icon={UserIcon}>
                        <Input
                          placeholder="Как к вам обращаться"
                          value={phoneName}
                          onChange={(e) => setPhoneName(e.target.value)}
                          autoComplete="name"
                          withIcon
                        />
                      </Field>

                      <label className="flex items-start gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={phoneAgree}
                          onChange={(e) => setPhoneAgree(e.target.checked)}
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

                      <button
                        type="button"
                        onClick={onResendPhoneCode}
                        disabled={resendSec > 0 || loading}
                        className="w-full text-sm text-sun font-medium hover:underline disabled:text-slate-400 disabled:no-underline"
                      >
                        {resendSec > 0
                          ? `Отправить код повторно через ${resendSec} сек`
                          : "Отправить код повторно"}
                      </button>
                    </form>
                  )}
                </>
              )}

              {authMethod === "email" && tab === "login" && (
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

              {authMethod === "email" && tab === "register" && registrationEnabled && (
                <form onSubmit={onRegister} className="space-y-4">
                  <Field label="ФИО" icon={UserIcon}>
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

            <div className="border-t border-ink/10 bg-mist-50 px-5 py-3 text-center">
              <button
                type="button"
                onClick={() =>
                  switchAuthMethod(authMethod === "phone" ? "email" : "phone")
                }
                className="text-sm text-slate-600 hover:text-sun font-medium"
              >
                {authMethod === "phone"
                  ? "Войти или зарегистрироваться по email"
                  : "Войти или зарегистрироваться по номеру телефона"}
              </button>
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
