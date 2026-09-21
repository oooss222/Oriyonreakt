import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:webview_flutter/webview_flutter.dart";

import "../../api/api_exception.dart";
import "../../models/message.dart";
import "../../state/providers.dart";
import "../../theme.dart";
import "../../utils/format.dart";
import "../../widgets/common.dart";

class WalletScreen extends ConsumerStatefulWidget {
  const WalletScreen({super.key});

  @override
  ConsumerState<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends ConsumerState<WalletScreen> {
  final _amount = TextEditingController(text: "20");
  bool _loading = false;

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  Future<void> _topUp() async {
    final amount = num.tryParse(_amount.text.replaceAll(",", ".")) ?? 0;
    if (amount <= 0) return;
    setState(() => _loading = true);
    try {
      final result = await ref.read(apiClientProvider).initAlifTopUp(amount);
      final url = "${result["paymentUrl"] ?? ""}";
      final orderId = "${result["orderId"] ?? ""}";
      if (!mounted) return;
      if (url.isEmpty) {
        throw ApiException("Платёжная ссылка недоступна");
      }
      await context.push("/wallet/checkout", extra: {"url": url, "orderId": orderId});
      await ref.read(authControllerProvider.notifier).refreshMe();
      setState(() {});
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final user = ref.watch(authControllerProvider).user;
    return Scaffold(
      appBar: AppBar(title: Text(t.t("profile.wallet"))),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AppCard(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t.t("wallet.balance"), style: AppText.caption),
                const SizedBox(height: 8),
                Text(formatSomoni(user?.walletBalance ?? 0), style: AppText.display.copyWith(color: DiyorColors.sun700)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _amount,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(labelText: t.t("wallet.amount")),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: [
              for (final value in [10, 20, 50, 100])
                AppChip(
                  label: "$value TJS",
                  selected: _amount.text == "$value",
                  onTap: () => setState(() => _amount.text = "$value"),
                ),
            ],
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _loading ? null : _topUp,
            child: Text(_loading ? t.t("common.loading") : t.t("wallet.pay")),
          ),
          const SizedBox(height: 24),
          Text(t.t("wallet.history"), style: AppText.h2),
          const SizedBox(height: 8),
          FutureBuilder<List<WalletTx>>(
            future: ref.read(apiClientProvider).walletTransactions(),
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Padding(
                  padding: EdgeInsets.all(24),
                  child: AppLoading(),
                );
              }
              final items = snapshot.data ?? [];
              if (items.isEmpty) {
                return EmptyView(message: t.t("wallet.empty"), icon: Icons.receipt_long_outlined);
              }
              return Column(
                children: [
                  for (final tx in items)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(tx.note.isEmpty ? tx.type : tx.note),
                      subtitle: Text(formatMessageTime(tx.createdAt), style: AppText.caption),
                      trailing: Text(
                        formatSomoni(tx.amount),
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key, required this.url, required this.orderId});

  final String url;
  final String orderId;

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  late final WebViewController _controller;
  var _loadingPage = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _loadingPage = true);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _loadingPage = false);
          },
          onNavigationRequest: (request) {
            if (request.url.contains("payment=return") || request.url.contains("tab=wallet")) {
              _finish();
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  Future<void> _finish() async {
    if (widget.orderId.isNotEmpty) {
      try {
        await ref.read(apiClientProvider).syncAlifPayment(widget.orderId);
      } catch (_) {}
    }
    await ref.read(authControllerProvider.notifier).refreshMe();
    if (mounted) context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Alif"),
        leading: IconButton(onPressed: _finish, icon: const Icon(Icons.close)),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loadingPage) const LinearProgressIndicator(minHeight: 2),
        ],
      ),
    );
  }
}
