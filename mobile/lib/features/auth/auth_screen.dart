import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../api/api_exception.dart";
import "../../state/providers.dart";
import "../../theme.dart";
import "../../utils/phone.dart";
import "../../widgets/common.dart";

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  bool _register = false;
  bool _email = false;
  bool _loading = false;
  bool _obscure = true;
  String _error = "";
  String _ok = "";
  String _devCode = "";
  String _phoneDisplay = "";
  String _step = "phone";

  final _phone = TextEditingController();
  final _code = TextEditingController();
  final _name = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _agree = false;

  @override
  void dispose() {
    _phone.dispose();
    _code.dispose();
    _name.dispose();
    _emailCtrl.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    final t = ref.read(stringsProvider);
    final digits = normalizePhoneInput(_phone.text);
    if (!isValidPhoneDigits(digits)) {
      setState(() => _error = t.t("auth.invalidPhone"));
      return;
    }
    setState(() {
      _loading = true;
      _error = "";
    });
    try {
      final result = await ref.read(authControllerProvider.notifier).sendPhoneCode(
            phoneDigitsToApi(digits),
            _register ? "register" : "login",
          );
      setState(() {
        _step = "code";
        _phoneDisplay = "${result["phoneDisplay"] ?? formatPhoneLocalDigits(digits)}";
        _devCode = "${result["devCode"] ?? ""}";
        _ok = t.t("auth.codeSentTo", {"phone": _phoneDisplay});
      });
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verify() async {
    final t = ref.read(stringsProvider);
    if (_register && _name.text.trim().isEmpty) {
      setState(() => _error = t.t("auth.nameRequired"));
      return;
    }
    if (_register && !_agree) {
      setState(() => _error = t.t("auth.needAgree"));
      return;
    }
    setState(() {
      _loading = true;
      _error = "";
    });
    try {
      await ref.read(authControllerProvider.notifier).verifyPhone(
            phone: phoneDigitsToApi(_phone.text),
            code: _code.text.trim(),
            mode: _register ? "register" : "login",
            name: _name.text.trim(),
          );
      if (mounted) context.go("/");
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submitEmail() async {
    final t = ref.read(stringsProvider);
    setState(() {
      _loading = true;
      _error = "";
    });
    try {
      if (_register) {
        if (_password.text.length < 8) {
          throw ApiException(t.t("auth.passwordShort"));
        }
        if (_password.text != _confirm.text) {
          throw ApiException(t.t("auth.passwordMismatch"));
        }
        if (!_agree) throw ApiException(t.t("auth.needAgree"));
        await ref.read(authControllerProvider.notifier).registerEmail(
              name: _name.text.trim(),
              email: _emailCtrl.text.trim(),
              password: _password.text,
            );
      } else {
        await ref.read(authControllerProvider.notifier).loginEmail(
              _emailCtrl.text.trim(),
              _password.text,
            );
      }
      if (mounted) context.go("/");
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const BrandMark(),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Text(
            _register ? t.t("auth.createAccount") : t.t("auth.welcome"),
            style: AppText.h1,
          ),
          const SizedBox(height: 6),
          Text(
            _register ? t.t("auth.subtitleRegister") : t.t("auth.subtitleLogin"),
            style: AppText.body.copyWith(color: context.diyor.muted),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              TrustChip(label: t.t("auth.free")),
              TrustChip(label: t.t("auth.safe")),
              TrustChip(label: t.t("auth.noFee")),
              TrustChip(label: t.t("auth.minute")),
            ],
          ),
          const SizedBox(height: 20),
          AppCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: context.diyor.chip,
                    borderRadius: AppRadii.button,
                  ),
                  child: Row(
                    children: [
                      _AuthTab(
                        label: t.t("auth.loginTab"),
                        selected: !_register,
                        onTap: () => setState(() {
                          _register = false;
                          _step = "phone";
                          _error = "";
                        }),
                      ),
                      _AuthTab(
                        label: t.t("auth.registerTab"),
                        selected: _register,
                        onTap: () => setState(() {
                          _register = true;
                          _step = "phone";
                          _error = "";
                        }),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    AppChip(
                      label: t.t("auth.phone"),
                      selected: !_email,
                      onTap: () => setState(() => _email = false),
                    ),
                    AppChip(
                      label: t.t("auth.email"),
                      selected: _email,
                      onTap: () => setState(() => _email = true),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (_error.isNotEmpty) AppBanner(message: _error),
                if (_ok.isNotEmpty && _error.isEmpty)
                  AppBanner(message: _ok, tone: AppBannerTone.success),
                if (_devCode.isNotEmpty)
                  AppBanner(
                    message: t.t("auth.devCode", {"code": _devCode}),
                    tone: AppBannerTone.info,
                  ),
                if (!_email) ...[
                  if (_step == "phone") ...[
                    TextField(
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: InputDecoration(
                        labelText: t.t("auth.phone"),
                        prefixText: "+992 ",
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _loading ? null : _sendCode,
                      child: Text(_loading ? t.t("common.loading") : t.t("auth.sendCode")),
                    ),
                  ] else ...[
                    TextField(
                      controller: _code,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      decoration: InputDecoration(labelText: t.t("auth.code")),
                    ),
                    if (_register) ...[
                      TextField(
                        controller: _name,
                        decoration: InputDecoration(labelText: t.t("auth.name")),
                      ),
                      CheckboxListTile(
                        value: _agree,
                        onChanged: (value) => setState(() => _agree = value ?? false),
                        title: Text(t.t("auth.agree")),
                        contentPadding: EdgeInsets.zero,
                        controlAffinity: ListTileControlAffinity.leading,
                      ),
                    ],
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: _loading ? null : _verify,
                      child: Text(_loading ? t.t("common.loading") : t.t("auth.verify")),
                    ),
                    TextButton(
                      onPressed: _loading ? null : _sendCode,
                      child: Text(t.t("auth.resend")),
                    ),
                  ],
                ] else ...[
                  if (_register)
                    TextField(
                      controller: _name,
                      decoration: InputDecoration(labelText: t.t("auth.name")),
                    ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(labelText: t.t("auth.email")),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _password,
                    obscureText: _obscure,
                    decoration: InputDecoration(
                      labelText: t.t("auth.password"),
                      suffixIcon: IconButton(
                        onPressed: () => setState(() => _obscure = !_obscure),
                        icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                      ),
                    ),
                  ),
                  if (_register) ...[
                    const SizedBox(height: 8),
                    TextField(
                      controller: _confirm,
                      obscureText: _obscure,
                      decoration: InputDecoration(labelText: t.t("auth.confirm")),
                    ),
                    CheckboxListTile(
                      value: _agree,
                      onChanged: (value) => setState(() => _agree = value ?? false),
                      title: Text(t.t("auth.agree")),
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                    ),
                  ],
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _loading ? null : _submitEmail,
                    child: Text(
                      _loading
                          ? t.t("common.loading")
                          : (_register ? t.t("auth.registerTab") : t.t("auth.loginTab")),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AuthTab extends StatelessWidget {
  const _AuthTab({required this.label, required this.selected, required this.onTap});

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.all(4),
        child: Material(
          color: selected ? DiyorColors.sun : Colors.transparent,
          borderRadius: AppRadii.button,
          child: InkWell(
            onTap: onTap,
            borderRadius: AppRadii.button,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: selected ? Colors.white : context.diyor.muted,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
