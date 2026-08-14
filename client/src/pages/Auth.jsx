import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { TOKEN_KEY, USER_KEY } from "../lib/auth";
import AuthTrustPanel, {
  AuthMobileBenefits,
} from "../components/auth/AuthTrustPanel";
import AuthMethodSwitch from "../components/auth/AuthMethodSwitch";
import RegisterProgress from "../components/auth/RegisterProgress";
import PhoneAuthFlow from "../components/auth/PhoneAuthFlow";
import EmailRegisterForm, {
  EmailLoginForm,
} from "../components/auth/EmailAuthForms";
import { Alert } from "../components/auth/AuthUi";
import {
  isValidPhoneDigits,
  phoneDigitsToApi,
} from "../lib/phoneUtils";

function getAuthSubtitle(returnTo, tab) {
  const path = String(returnTo || "").toLowerCase();

  if (tab === "register") {
    if (path.includes("/add") || path.includes("edit")) {
      return "Создайте аккаунт, чтобы подать объявление — это займёт около минуты";
    }
    return "Бесплатная регистрация: публикуйте объявления и получайте отклики";
  }

  if (path.includes("fav")) {
    return "Войдите, чтобы сохранять объявления в избранное";
  }
  if (path.includes("/add") || path.includes("edit")) {
    return "Войдите, чтобы подать или редактировать объявление";
  }
  if (path.includes("messages")) {
    return "Войдите, чтобы писать продавцам и покупателям";
  }
  if (path.includes("profile?tab=promote")) {
    return "Войдите, чтобы продвинуть объявление";
  }
  if (path.includes("wallet")) {
    return "Войдите, чтобы пополнить кошелёк";
  }

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
      .then((data) => setRegistrationEnabled(Boolean(data.registrationEnabled)))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (authMethod === "phone") {
      if (phoneStep === "code") {
        codeRef.current?.focus?.();
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

  React.useEffect(() => {
    if (!registrationEnabled && tab === "register") {
      switchTab("login");
    }
  }, [registrationEnabled, tab, switchTab]);

  const persistAuth = React.useCallback(
    ({ token, user }) => {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setOk(
        tab === "login"
          ? "Вход выполнен! Перенаправляем…"
          : "Аккаунт создан! Перенаправляем…"
      );
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

  const subtitle = getAuthSubtitle(returnTo, tab);
  const isRegister = tab === "register" && registrationEnabled;

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-grid">
          <div className="w-full max-w-xl mx-auto lg:max-w-none lg:mx-0">
            <div className="auth-header">
              <h1 className="auth-header__title">
                {tab === "login" ? "Добро пожаловать" : "Создайте аккаунт"}
              </h1>
              <p className="auth-header__subtitle">{subtitle}</p>
              <AuthMobileBenefits mode={tab} />
            </div>

            <div className="auth-card">
              <div className="auth-card__tabs">
                <div
                  className={`auth-card__tabbar ${
                    registrationEnabled ? "grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  <button
                    type="button"
                    className={`auth-card__tab ${
                      tab === "login"
                        ? "auth-card__tab--active"
                        : "auth-card__tab--idle"
                    }`}
                    onClick={() => switchTab("login")}
                  >
                    Вход
                  </button>
                  {registrationEnabled && (
                    <button
                      type="button"
                      className={`auth-card__tab ${
                        tab === "register"
                          ? "auth-card__tab--active"
                          : "auth-card__tab--idle"
                      }`}
                      onClick={() => switchTab("register")}
                    >
                      Регистрация
                    </button>
                  )}
                </div>
              </div>

              <div className="auth-card__body">
                <AuthMethodSwitch value={authMethod} onChange={switchAuthMethod} />

                {isRegister ? (
                  <RegisterProgress
                    authMethod={authMethod}
                    phoneStep={phoneStep}
                  />
                ) : null}

                <Alert type="error">{err}</Alert>
                <Alert type="success">{ok}</Alert>

                {devCodeHint && authMethod === "phone" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {devCodeHint}
                  </div>
                )}

                {authMethod === "phone" ? (
                  <PhoneAuthFlow
                    mode={tab}
                    phoneStep={phoneStep}
                    phoneDigits={phoneDigits}
                    onPhoneDigitsChange={setPhoneDigits}
                    phoneCode={phoneCode}
                    onPhoneCodeChange={setPhoneCode}
                    phoneName={phoneName}
                    onPhoneNameChange={setPhoneName}
                    phoneAgree={phoneAgree}
                    onPhoneAgreeChange={setPhoneAgree}
                    phoneDisplay={phoneDisplay}
                    resendSec={resendSec}
                    loading={loading}
                    phoneRef={phoneRef}
                    codeRef={codeRef}
                    onSendCode={onSendPhoneCode}
                    onVerifyCode={onVerifyPhoneCode}
                    onResendCode={onResendPhoneCode}
                    onResetPhone={resetPhoneFlow}
                  />
                ) : tab === "login" ? (
                  <EmailLoginForm
                    login={login}
                    onChange={(patch) =>
                      setLogin((value) => ({ ...value, ...patch }))
                    }
                    loading={loading}
                    onSubmit={onLogin}
                    showPass={showPassLogin}
                    onTogglePass={() => setShowPassLogin((value) => !value)}
                    capsLock={capsLogin}
                    onCapsLockChange={setCapsLogin}
                    emailRef={emailRef}
                  />
                ) : registrationEnabled ? (
                  <EmailRegisterForm
                    reg={reg}
                    onChange={(patch) =>
                      setReg((value) => ({ ...value, ...patch }))
                    }
                    loading={loading}
                    onSubmit={onRegister}
                    showPass={showPassReg}
                    onTogglePass={() => setShowPassReg((value) => !value)}
                    showConfirm={showPassReg2}
                    onToggleConfirm={() => setShowPassReg2((value) => !value)}
                  />
                ) : null}
              </div>
            </div>

            <div className="auth-footer-link">
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

          <AuthTrustPanel mode={tab} />
        </div>
      </div>
    </div>
  );
}
