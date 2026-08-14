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
import {
  applyAuthError,
  applyIdentityCheckResult,
  translateAuthMessage,
} from "../lib/authIdentity";
import { useI18n } from "../i18n";

function getAuthSubtitle(returnTo, tab, t) {
  const path = String(returnTo || "").toLowerCase();

  if (tab === "register") {
    if (path.includes("/add") || path.includes("edit")) {
      return t("auth.subtitleRegisterAdd");
    }
    return t("auth.subtitleRegisterDefault");
  }

  if (path.includes("fav")) {
    return t("auth.subtitleLoginFav");
  }
  if (path.includes("/add") || path.includes("edit")) {
    return t("auth.subtitleLoginAdd");
  }
  if (path.includes("messages")) {
    return t("auth.subtitleLoginMessages");
  }
  if (path.includes("profile?tab=promote")) {
    return t("auth.subtitleLoginPromote");
  }
  if (path.includes("wallet")) {
    return t("auth.subtitleLoginWallet");
  }

  return t("auth.subtitleLoginDefault");
}

export default function Auth() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/profile";
  const urlTab = searchParams.get("tab") === "register" ? "register" : "login";
  const { t } = useI18n();

  const redirectAfterAuth = React.useCallback(() => {
    nav(returnTo.startsWith("/") ? returnTo : "/profile", { replace: true });
  }, [nav, returnTo]);

  const [tab, setTab] = React.useState(urlTab);
  const [authMethod, setAuthMethod] = React.useState("phone");
  const [phoneStep, setPhoneStep] = React.useState("phone");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [ok, setOk] = React.useState("");
  const [identityHint, setIdentityHint] = React.useState(null);
  const [emailFieldHint, setEmailFieldHint] = React.useState("");

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
      setIdentityHint(null);
      setEmailFieldHint("");
      resetPhoneFlow();
    },
    [resetPhoneFlow]
  );

  const switchTab = React.useCallback(
    (nextTab) => {
      setTab(nextTab);
      setErr("");
      setOk("");
      setIdentityHint(null);
      setEmailFieldHint("");
      resetPhoneFlow();

      const params = new URLSearchParams(searchParams);
      params.set("tab", nextTab);
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams, resetPhoneFlow]
  );

  const runIdentityHintAction = React.useCallback(() => {
    if (!identityHint?.tab) return;
    switchTab(identityHint.tab);
  }, [identityHint, switchTab]);

  const checkEmailIdentity = React.useCallback(
    async (emailValue) => {
      const email = String(emailValue || "").trim().toLowerCase();

      if (!/^\S+@\S+\.\S+$/.test(email)) {
        setEmailFieldHint("");
        return;
      }

      try {
        const result = await api.checkIdentity({ email, intent: tab });
        if (result?.ok === false) {
          setEmailFieldHint(
            translateAuthMessage(t, result.code, result.message || "")
          );
        } else {
          setEmailFieldHint("");
        }
      } catch {
        setEmailFieldHint("");
      }
    },
    [tab, t]
  );

  const checkPhoneIdentity = React.useCallback(
    async (digits) => {
      if (!isValidPhoneDigits(digits)) {
        setEmailFieldHint("");
        return;
      }

      try {
        const result = await api.checkIdentity({
          phone: phoneDigitsToApi(digits),
          intent: tab,
        });

        if (result?.ok === false) {
          setEmailFieldHint(
            translateAuthMessage(t, result.code, result.message || "")
          );
        } else {
          setEmailFieldHint("");
        }
      } catch {
        setEmailFieldHint("");
      }
    },
    [tab, t]
  );

  React.useEffect(() => {
    if (authMethod !== "email") return undefined;

    const emailValue = tab === "login" ? login.email : reg.email;
    const timer = window.setTimeout(() => {
      checkEmailIdentity(emailValue);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [authMethod, tab, login.email, reg.email, checkEmailIdentity]);

  React.useEffect(() => {
    if (authMethod !== "phone" || phoneStep !== "phone") return undefined;

    const timer = window.setTimeout(() => {
      checkPhoneIdentity(phoneDigits);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [authMethod, phoneStep, phoneDigits, checkPhoneIdentity]);

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
        tab === "login" ? t("auth.loginSuccess") : t("auth.registerSuccess")
      );
      window.setTimeout(() => redirectAfterAuth(), 300);
    },
    [redirectAfterAuth, tab, t]
  );

  const onSendPhoneCode = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setIdentityHint(null);
    setDevCodeHint("");

    if (!isValidPhoneDigits(phoneDigits)) {
      setErr(t("auth.errPhoneFormat"));
      return;
    }

    setLoading(true);

    try {
      const check = await api.checkIdentity({
        phone: phoneDigitsToApi(phoneDigits),
        intent: tab,
      });

      if (check?.ok === false) {
        applyIdentityCheckResult(check, { setErr, setIdentityHint, t });
        return;
      }

      const data = await api.sendPhoneCode({
        phone: phoneDigitsToApi(phoneDigits),
        mode: tab,
      });

      setPhoneDisplay(data.phoneDisplay || phoneDigitsToApi(phoneDigits));
      setPhoneStep("code");
      setResendSec(Number(data.retryAfterSec) || 60);

      if (data.devCode) {
        setDevCodeHint(t("auth.devCode", { code: data.devCode }));
      }

      setOk(
        t("auth.codeSentTo", {
          phone: data.phoneDisplay || phoneDigitsToApi(phoneDigits),
        })
      );
    } catch (e) {
      applyAuthError(e, { setErr, setIdentityHint, t });
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPhoneCode = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setIdentityHint(null);

    if (!/^\d{6}$/.test(phoneCode)) {
      setErr(t("auth.errPhoneCode"));
      return;
    }

    if (tab === "register" && !phoneName.trim()) {
      setErr(t("auth.errNameRequired"));
      return;
    }

    if (tab === "register" && !phoneAgree) {
      setErr(t("auth.errPolicyRequired"));
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
      applyAuthError(e, { setErr, setIdentityHint, t });
    } finally {
      setLoading(false);
    }
  };

  const onResendPhoneCode = async () => {
    if (resendSec > 0 || loading) return;

    setErr("");
    setOk("");
    setIdentityHint(null);
    setDevCodeHint("");
    setLoading(true);

    try {
      const data = await api.sendPhoneCode({
        phone: phoneDigitsToApi(phoneDigits),
        mode: tab,
      });

      setResendSec(Number(data.retryAfterSec) || 60);

      if (data.devCode) {
        setDevCodeHint(t("auth.devCode", { code: data.devCode }));
      }

      setOk(t("auth.codeResent"));
    } catch (e) {
      applyAuthError(e, { setErr, setIdentityHint, t });
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setIdentityHint(null);
    setLoading(true);

    try {
      if (!login.email || !login.password) {
        throw new Error(t("auth.errEmailPasswordRequired"));
      }

      const check = await api.checkIdentity({
        email: login.email.trim(),
        intent: "login",
      });

      if (check?.ok === false) {
        applyIdentityCheckResult(check, { setErr, setIdentityHint, t });
        return;
      }

      const { token, user } = await api.login({
        email: login.email.trim(),
        password: login.password,
      });

      persistAuth({ token, user });
    } catch (e) {
      applyAuthError(e, { setErr, setIdentityHint, t });
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setIdentityHint(null);
    setLoading(true);

    try {
      if (!reg.name || !reg.email || !reg.password || !reg.confirm) {
        throw new Error(t("auth.errAllFieldsRequired"));
      }

      if (!/^\S+@\S+\.\S+$/.test(reg.email.trim())) {
        throw new Error(t("auth.errInvalidEmail"));
      }

      if (reg.password.length < 6) {
        throw new Error(t("auth.errPasswordMin"));
      }

      if (reg.password !== reg.confirm) {
        throw new Error(t("auth.errPasswordMismatch"));
      }

      if (!reg.agree) {
        throw new Error(t("auth.errPolicyRequired"));
      }

      const check = await api.checkIdentity({
        email: reg.email.trim(),
        intent: "register",
      });

      if (check?.ok === false) {
        applyIdentityCheckResult(check, { setErr, setIdentityHint, t });
        return;
      }

      const { token, user } = await api.register({
        name: reg.name.trim(),
        email: reg.email.trim(),
        password: reg.password,
      });

      persistAuth({ token, user });
    } catch (e) {
      applyAuthError(e, { setErr, setIdentityHint, t });
    } finally {
      setLoading(false);
    }
  };

  const subtitle = getAuthSubtitle(returnTo, tab, t);
  const isRegister = tab === "register" && registrationEnabled;

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-grid">
          <div className="w-full max-w-xl mx-auto lg:max-w-none lg:mx-0">
            <div className="auth-header">
              <h1 className="auth-header__title">
                {tab === "login" ? t("auth.welcome") : t("auth.createAccount")}
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
                    {t("auth.loginTab")}
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
                      {t("auth.registerTab")}
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

                <Alert
                  type="error"
                  actionLabel={identityHint?.label}
                  onAction={runIdentityHintAction}
                >
                  {err}
                </Alert>
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
                    fieldHint={emailFieldHint}
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
                    emailHint={emailFieldHint}
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
                    emailHint={emailFieldHint}
                  />
                ) : null}
              </div>
            </div>

            <div className="auth-footer-link">
              {tab === "login" ? (
                registrationEnabled ? (
                  <>
                    {t("auth.noAccount")}{" "}
                    <button
                      type="button"
                      className="text-sun font-medium hover:underline"
                      onClick={() => switchTab("register")}
                    >
                      {t("auth.registerLink")}
                    </button>
                  </>
                ) : null
              ) : (
                <>
                  {t("auth.hasAccount")}{" "}
                  <button
                    type="button"
                    className="text-sun font-medium hover:underline"
                    onClick={() => switchTab("login")}
                  >
                    {t("auth.loginLink")}
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
