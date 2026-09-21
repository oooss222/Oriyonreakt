import "package:flutter/material.dart";
import "package:go_router/go_router.dart";

import "../theme.dart";
import "motion.dart";
import "ui.dart";

class AppLoading extends StatelessWidget {
  const AppLoading({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: CircularProgressIndicator());
  }
}

class ListingSkeleton extends StatelessWidget {
  const ListingSkeleton({super.key, this.count = 6});

  final int count;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(AppSpace.sm),
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: ListingGridDelegate.of(context),
      itemCount: count,
      itemBuilder: (_, _) => const _SkeletonCard(),
    );
  }
}

class _SkeletonCard extends StatefulWidget {
  const _SkeletonCard();

  @override
  State<_SkeletonCard> createState() => _SkeletonCardState();
}

class _SkeletonCardState extends State<_SkeletonCard> with SingleTickerProviderStateMixin {
  AnimationController? _c;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (AppMotion.reduce(context)) {
      _c?.dispose();
      _c = null;
      return;
    }
    _c ??= AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _c?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final card = DecoratedBox(
      decoration: BoxDecoration(
        color: context.diyor.surface,
        borderRadius: AppRadii.card,
        border: Border.all(color: context.diyor.line),
      ),
      child: Column(
        children: [
          Expanded(
            flex: 6,
            child: ColoredBox(color: context.diyor.placeholder),
          ),
          Expanded(
            flex: 4,
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(height: 10, width: 72, color: context.diyor.chip),
                  const SizedBox(height: 8),
                  Container(height: 12, width: double.infinity, color: context.diyor.chip),
                  const SizedBox(height: 6),
                  Container(height: 12, width: 88, color: context.diyor.chip),
                ],
              ),
            ),
          ),
        ],
      ),
    );
    final controller = _c;
    if (controller == null) return card;
    return FadeTransition(
      opacity: Tween(begin: 0.45, end: 1.0).animate(controller),
      child: card,
    );
  }
}

class EmptyView extends StatelessWidget {
  const EmptyView({
    super.key,
    required this.message,
    this.icon = Icons.search_off,
    this.actionLabel,
    this.onAction,
  });

  final String message;
  final IconData icon;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return AppAppear(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpace.xxl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: DiyorColors.sun50,
                  borderRadius: BorderRadius.circular(AppRadii.md),
                ),
                child: Icon(icon, size: 32, color: DiyorColors.sun),
              ),
              const SizedBox(height: AppSpace.sm),
              Text(message, textAlign: TextAlign.center, style: AppText.bodyLarge),
              if (onAction != null && actionLabel != null) ...[
                const SizedBox(height: AppSpace.md),
                FilledButton(onPressed: onAction, child: Text(actionLabel!)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class ErrorView extends StatelessWidget {
  const ErrorView({
    super.key,
    required this.message,
    required this.onRetry,
    this.retryLabel = "Повторить",
  });

  final String message;
  final VoidCallback onRetry;
  final String retryLabel;

  @override
  Widget build(BuildContext context) {
    return AppAppear(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpace.xl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.wifi_off_rounded, size: 40, color: context.diyor.muted),
              const SizedBox(height: AppSpace.sm),
              Text(message, textAlign: TextAlign.center, style: AppText.body),
              const SizedBox(height: AppSpace.md),
              FilledButton(onPressed: onRetry, child: Text(retryLabel)),
            ],
          ),
        ),
      ),
    );
  }
}

class LoginGate extends StatelessWidget {
  const LoginGate({super.key, required this.message, this.actionLabel = "Войти"});

  final String message;
  final String actionLabel;

  @override
  Widget build(BuildContext context) {
    return AppAppear(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpace.xxl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: DiyorColors.sun50,
                  borderRadius: BorderRadius.circular(AppRadii.md),
                ),
                child: const Icon(Icons.lock_outline, size: 32, color: DiyorColors.sun),
              ),
              const SizedBox(height: AppSpace.sm),
              Text(message, textAlign: TextAlign.center, style: AppText.bodyLarge),
              const SizedBox(height: AppSpace.md),
              FilledButton(
                onPressed: () => context.push("/auth"),
                child: Text(actionLabel),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
