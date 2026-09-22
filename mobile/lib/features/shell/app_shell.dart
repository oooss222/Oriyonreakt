import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../state/providers.dart";
import "../../theme.dart";
import "../../widgets/ad_slot.dart";
import "../../widgets/motion_nav_bar.dart";

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  static const _tabs = ["/home", "/favorites", "/add", "/messages", "/profile"];

  static int indexForPath(String path) {
    if (path.startsWith("/favorites")) return 1;
    if (path.startsWith("/add")) return 2;
    if (path.startsWith("/messages")) return 3;
    if (path.startsWith("/profile")) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final unread = ref.watch(unreadCountProvider).valueOrNull ?? 0;
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    final keyboardOpen = MediaQuery.viewInsetsOf(context).bottom > 0;
    final path = GoRouterState.of(context).uri.path;
    final inThread = path.contains("/thread/");
    final hideSticky = path.startsWith("/add") || path.startsWith("/messages") || path.startsWith("/auth");

    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          AdInterstitial(
            child: AnimatedSwitcher(
              duration: AppMotion.of(context, AppMotion.fast),
              switchInCurve: AppMotion.enter,
              switchOutCurve: AppMotion.exit,
              layoutBuilder: (current, _) => current ?? const SizedBox.shrink(),
              child: KeyedSubtree(
                key: ValueKey(indexForPath(path)),
                child: child,
              ),
            ),
          ),
          if (!keyboardOpen && !inThread && !hideSticky)
            Positioned(
              left: 12,
              right: 12,
              bottom: AppSpace.navHeight + 18 + bottomInset,
              child: const AdStickyBar(),
            ),
        ],
      ),
      bottomNavigationBar: keyboardOpen || inThread
          ? null
          : Padding(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 10 + bottomInset),
              child: DiyorMotionNavBar(
                index: indexForPath(path),
                onChanged: (index) => context.go(_tabs[index]),
                items: [
                  MotionNavItem(
                    icon: Icons.home_outlined,
                    selectedIcon: Icons.home_rounded,
                    label: t.t("nav.home"),
                  ),
                  MotionNavItem(
                    icon: Icons.favorite_border_rounded,
                    selectedIcon: Icons.favorite_rounded,
                    label: t.t("nav.favorites"),
                  ),
                  MotionNavItem(
                    icon: Icons.add_rounded,
                    selectedIcon: Icons.add_rounded,
                    label: t.t("nav.add"),
                    highlight: true,
                  ),
                  MotionNavItem(
                    icon: Icons.chat_bubble_outline_rounded,
                    selectedIcon: Icons.chat_bubble_rounded,
                    label: t.t("nav.chat"),
                    badge: unread,
                  ),
                  MotionNavItem(
                    icon: Icons.person_outline_rounded,
                    selectedIcon: Icons.person_rounded,
                    label: t.t("nav.profile"),
                  ),
                ],
              ),
            ),
    );
  }
}
