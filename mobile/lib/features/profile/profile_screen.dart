import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../api/api_exception.dart";
import "../../config.dart";
import "../../data/catalog.dart";
import "../../l10n/strings.dart";
import "../../models/listing.dart";
import "../../models/user.dart";
import "../../state/providers.dart";
import "../../theme.dart";
import "../../utils/format.dart";
import "../../utils/phone.dart";
import "../../utils/support.dart";
import "../../widgets/common.dart";
import "account_widgets.dart";

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(stringsProvider);
    final auth = ref.watch(authControllerProvider);
    final header = AccountHeader(
      title: t.t("profile.account"),
      actions: [
        AccountRoundButton(
          icon: Icons.ios_share_rounded,
          tooltip: t.t("profile.share"),
          onTap: () => _share(context, t, auth.user),
        ),
        const SizedBox(width: 8),
        AccountRoundButton(
          icon: Icons.settings_outlined,
          tooltip: t.t("profile.settings"),
          onTap: () => context.push("/profile/settings"),
        ),
      ],
    );

    if (auth.loading) {
      return Scaffold(
        body: Column(
          children: [
            header,
            const Expanded(child: AppLoading()),
          ],
        ),
      );
    }

    if (!auth.isLoggedIn) {
      return Scaffold(
        body: Column(
          children: [
            header,
            Expanded(
              child: ListView(
                padding: EdgeInsets.fromLTRB(16, 8, 16, AppSpace.belowNav(context)),
                children: [
                  AccountGroup(
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 20, 16, 20),
                        child: Column(
                          children: [
                            const AccountAvatar(name: "Diyor", size: 64),
                            const SizedBox(height: 12),
                            Text(t.t("profile.guest"), style: AppText.h3),
                            const SizedBox(height: 4),
                            Text(
                              t.t("profile.guestHint"),
                              textAlign: TextAlign.center,
                              style: AppText.body.copyWith(color: context.diyor.muted),
                            ),
                            const SizedBox(height: 16),
                            FilledButton(
                              onPressed: () => context.push("/auth"),
                              child: Text(t.t("nav.login")),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  AccountGroup(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          children: [
                            _SupportAction(
                              icon: Icons.mail_outline_rounded,
                              label: t.t("profile.emailUs"),
                              onTap: () => openSupportMail(subject: t.t("profile.support")),
                            ),
                            _SupportAction(
                              icon: Icons.forum_outlined,
                              label: t.t("profile.support"),
                              onTap: () => openSupportChat(context, ref.read(apiClientProvider)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    final user = auth.user!;
    final name = user.displayName.trim().isEmpty ? t.t("listing.seller") : user.displayName.trim();
    final phone = user.phone.trim().isNotEmpty
        ? formatPhonePretty(user.phone)
        : (user.email.trim().isNotEmpty ? user.email.trim() : t.t("seller.private"));
    final listings = ref.watch(myListingsProvider).valueOrNull?.length ?? 0;
    final favs = ref.watch(favoritesListProvider).valueOrNull?.length ?? 0;
    final unread = ref.watch(unreadCountProvider).valueOrNull ?? 0;
    final completion = _completion(user);
    final isCompany = user.sellerType == "company";

    return Scaffold(
      body: Column(
        children: [
          header,
          Expanded(
            child: RefreshIndicator(
              color: DiyorColors.sun,
              onRefresh: () async {
                await ref.read(authControllerProvider.notifier).refreshMe();
                ref.invalidate(myListingsProvider);
                ref.invalidate(favoritesListProvider);
                ref.invalidate(unreadCountProvider);
              },
              child: ListView(
              padding: EdgeInsets.fromLTRB(16, 4, 16, AppSpace.belowNav(context)),
              children: [
                AppAppear(
                  child: _ProfileHero(
                    name: name,
                    phone: phone,
                    strings: t,
                    user: user,
                    completion: completion,
                    listings: listings,
                    favorites: favs,
                    chats: unread,
                    onEdit: () => context.push("/profile/edit"),
                    onCopyPhone: () => _copyPhone(context, t, phone),
                  ),
                ),
                const SizedBox(height: 12),
                AppAppear(
                  delay: const Duration(milliseconds: 50),
                  child: isCompany
                      ? _PremiumActiveBanner(label: t, onTap: () => context.push("/seller/${user.id}"))
                      : _PremiumBanner(
                          label: t,
                          onTap: () => openSupportChat(
                            context,
                            ref.read(apiClientProvider),
                            title: premiumChatTitle,
                          ),
                        ),
                ),
                const SizedBox(height: 10),
                AppAppear(
                  delay: const Duration(milliseconds: 100),
                  child: AccountGroup(
                    children: [
                      AppPressable(
                        borderRadius: BorderRadius.zero,
                        onTap: () => context.push("/wallet"),
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
                          child: Row(
                            children: [
                              const AccountGlyph(
                                icon: Icons.account_balance_wallet_rounded,
                                color: DiyorColors.sun,
                                background: DiyorColors.sun50,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  t.t("profile.walletAccount"),
                                  style: AppText.bodyLarge.copyWith(fontWeight: FontWeight.w600, fontSize: 15),
                                ),
                              ),
                              Text(
                                formatWallet(user.walletBalance),
                                style: AppText.h3.copyWith(fontSize: 15),
                              ),
                              const SizedBox(width: 8),
                              Material(
                                color: DiyorColors.sun,
                                shape: const CircleBorder(),
                                child: InkWell(
                                  customBorder: const CircleBorder(),
                                  onTap: () => context.push("/wallet"),
                                  child: const SizedBox(
                                    width: 28,
                                    height: 28,
                                    child: Icon(Icons.add, color: Colors.white, size: 18),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      AccountTile(
                        icon: Icons.credit_card_outlined,
                        iconColor: const Color(0xFFCA8A04),
                        iconBackground: const Color(0xFFFEF3C7),
                        title: t.t("profile.payments"),
                        onTap: () => context.push("/wallet"),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                AppAppear(
                  delay: const Duration(milliseconds: 120),
                  child: AccountGroup(
                    children: [
                      AccountTile(
                        icon: Icons.inventory_2_outlined,
                        iconColor: const Color(0xFF2563EB),
                        iconBackground: const Color(0xFFDBEAFE),
                        title: t.t("profile.myListings"),
                        value: listings > 0 ? "$listings" : null,
                        onTap: () => context.push("/my-listings"),
                      ),
                      AccountTile(
                        icon: Icons.storefront_outlined,
                        iconColor: const Color(0xFF7C3AED),
                        iconBackground: const Color(0xFFEDE9FE),
                        title: t.t("profile.publicPage"),
                        onTap: () => context.push("/seller/${user.id}"),
                      ),
                      AccountTile(
                        icon: Icons.workspace_premium_outlined,
                        iconColor: DiyorColors.lagoon,
                        iconBackground: DiyorColors.lagoon50,
                        title: t.t("profile.promote"),
                        onTap: () => context.push("/my-listings"),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                AppAppear(
                  delay: const Duration(milliseconds: 140),
                  child: AccountGroup(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Row(
                          children: [
                            _SupportAction(
                              icon: Icons.chat_bubble_outline_rounded,
                              label: t.t("profile.reviewApp"),
                              onTap: () => openSupportMail(subject: t.t("profile.reviewSubject")),
                            ),
                            _SupportAction(
                              icon: Icons.mail_outline_rounded,
                              label: t.t("profile.emailUs"),
                              onTap: () => openSupportMail(subject: t.t("profile.support")),
                            ),
                            _SupportAction(
                              icon: Icons.forum_outlined,
                              label: t.t("profile.support"),
                              onTap: () => openSupportChat(context, ref.read(apiClientProvider)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                AppAppear(
                  delay: const Duration(milliseconds: 160),
                  child: AccountGroup(
                    children: [
                      AppPressable(
                        borderRadius: BorderRadius.zero,
                        onTap: () => _logout(context, ref, t),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.logout_rounded, color: DiyorColors.sun, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                t.t("profile.logout"),
                                style: AppText.bodyLarge.copyWith(
                                  color: DiyorColors.sun,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  t.t("profile.version", {"v": AppConfig.appVersion}),
                  textAlign: TextAlign.center,
                  style: AppText.caption.copyWith(color: context.diyor.muted),
                ),
              ],
            ),
            ),
          ),
        ],
      ),
    );
  }

  int _completion(AuthUser user) {
    final checks = [
      user.name.trim().isNotEmpty,
      user.phone.trim().isNotEmpty,
      user.whatsapp.trim().isNotEmpty || user.telegram.trim().isNotEmpty,
      user.emailVerified,
      user.sellerType != "company" || user.companyName.trim().isNotEmpty,
    ];
    return ((checks.where((item) => item).length / checks.length) * 100).round();
  }

  Future<void> _share(BuildContext context, AppStrings t, AuthUser? user) async {
    final url = user == null
        ? AppConfig.publicSite
        : "${AppConfig.publicSite}/seller/${user.id}";
    await Clipboard.setData(ClipboardData(text: url));
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t.t("profile.shareDone"))));
  }

  Future<void> _copyPhone(BuildContext context, AppStrings t, String phone) async {
    if (phone.isEmpty) return;
    await Clipboard.setData(ClipboardData(text: phone));
    if (!context.mounted) return;
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t.t("profile.copyPhone"))));
  }

  Future<void> _logout(BuildContext context, WidgetRef ref, AppStrings t) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(t.t("profile.logout")),
          content: Text(t.t("profile.logoutConfirm")),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t.t("common.cancel"))),
            TextButton(onPressed: () => Navigator.pop(context, true), child: Text(t.t("profile.logout"))),
          ],
        );
      },
    );
    if (ok == true) await ref.read(authControllerProvider.notifier).logout();
  }
}

class _ProfileHero extends StatelessWidget {
  const _ProfileHero({
    required this.name,
    required this.phone,
    required this.strings,
    required this.user,
    required this.completion,
    required this.listings,
    required this.favorites,
    required this.chats,
    required this.onEdit,
    required this.onCopyPhone,
  });

  final String name;
  final String phone;
  final AppStrings strings;
  final AuthUser user;
  final int completion;
  final int listings;
  final int favorites;
  final int chats;
  final VoidCallback onEdit;
  final VoidCallback onCopyPhone;

  @override
  Widget build(BuildContext context) {
    final palette = context.diyor;
    final company = user.sellerType == "company";
    return AccountGroup(
      children: [
        AppPressable(
          borderRadius: BorderRadius.zero,
          onTap: onEdit,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 10, 12),
            child: Row(
              children: [
                AccountAvatar(name: name, size: 54),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppText.h3.copyWith(fontSize: 17),
                            ),
                          ),
                          if (user.emailVerified || user.businessVerified) ...[
                            const SizedBox(width: 4),
                            const Icon(Icons.verified_rounded, size: 16, color: DiyorColors.lagoon),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      GestureDetector(
                        onLongPress: onCopyPhone,
                        child: Text(phone, style: AppText.body.copyWith(color: palette.ink)),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          AccountChip(
                            label: company ? strings.t("seller.company") : strings.t("seller.private"),
                            emphasized: company,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            strings.t("profile.manage"),
                            style: AppText.caption.copyWith(color: palette.muted),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right_rounded, color: palette.muted),
              ],
            ),
          ),
        ),
        if (completion < 100)
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  strings.t("profile.completion", {"percent": "$completion"}),
                  style: AppText.caption.copyWith(color: palette.muted),
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: AppRadii.pill,
                  child: LinearProgressIndicator(
                    value: completion / 100,
                    minHeight: 4,
                    backgroundColor: palette.chip,
                    color: DiyorColors.sun,
                  ),
                ),
              ],
            ),
          ),
        Divider(height: 1, color: palette.line),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(
            children: [
              _HeroStat(
                value: "$listings",
                label: strings.t("profile.statsListings"),
                onTap: () => context.push("/my-listings"),
              ),
              _HeroStat(
                value: "$favorites",
                label: strings.t("profile.statsFavs"),
                onTap: () => context.go("/favorites"),
              ),
              _HeroStat(
                value: "$chats",
                label: strings.t("profile.statsChats"),
                highlight: chats > 0,
                onTap: () => context.go("/messages"),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _HeroStat extends StatelessWidget {
  const _HeroStat({
    required this.value,
    required this.label,
    required this.onTap,
    this.highlight = false,
  });

  final String value;
  final String label;
  final VoidCallback onTap;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: AppPressable(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            children: [
              Text(
                value,
                style: AppText.h3.copyWith(
                  fontSize: 18,
                  color: highlight ? DiyorColors.sun : null,
                ),
              ),
              const SizedBox(height: 2),
              Text(label, style: AppText.caption.copyWith(color: context.diyor.muted)),
            ],
          ),
        ),
      ),
    );
  }
}

class _PremiumBanner extends StatelessWidget {
  const _PremiumBanner({required this.label, required this.onTap});

  final AppStrings label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppPressable(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: DecoratedBox(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF1C1B1A), Color(0xFF3A1A08), Color(0xFF121110)],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
          ),
          child: SizedBox(
            height: 118,
            child: Stack(
              children: [
                Positioned(
                  right: -8,
                  top: 10,
                  child: Opacity(
                    opacity: 0.95,
                    child: Row(
                      children: [
                        _fakeCard(const Color(0xFFC4B5FD), -8),
                        _fakeCard(const Color(0xFF8B5CF6), 0),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 110, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: DiyorColors.sun,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          label.t("profile.premiumFree"),
                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text.rich(
                        TextSpan(
                          children: [
                            TextSpan(
                              text: "${label.t("profile.premiumTitle")} ",
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16),
                            ),
                            WidgetSpan(
                              alignment: PlaceholderAlignment.middle,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF6D28D9),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  label.t("profile.premiumBadge"),
                                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        label.t("profile.premiumBody"),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Color(0xCCFFFFFF), fontSize: 11, height: 1.3),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: DiyorColors.sun,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          label.t("profile.premiumCta"),
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _fakeCard(Color color, double tilt) {
    return Transform.rotate(
      angle: tilt * 0.02,
      child: Container(
        width: 58,
        height: 72,
        margin: const EdgeInsets.only(right: 6),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(14),
          boxShadow: const [BoxShadow(color: Color(0x66000000), blurRadius: 12, offset: Offset(0, 6))],
        ),
        child: const Icon(Icons.apartment_rounded, color: Colors.white70, size: 28),
      ),
    );
  }
}

class _PremiumActiveBanner extends StatelessWidget {
  const _PremiumActiveBanner({required this.label, required this.onTap});

  final AppStrings label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppPressable(
      onTap: onTap,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: context.diyor.surface,
          borderRadius: BorderRadius.circular(18),
          boxShadow: AppShadows.soft,
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 14, 12, 14),
          child: Row(
            children: [
              const AccountGlyph(
                icon: Icons.verified_rounded,
                color: DiyorColors.lagoon,
                background: DiyorColors.lagoon50,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label.t("profile.premiumActive"), style: AppText.h3.copyWith(fontSize: 15)),
                    const SizedBox(height: 2),
                    Text(
                      label.t("profile.premiumActiveHint"),
                      style: AppText.caption.copyWith(color: context.diyor.muted),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: context.diyor.muted),
            ],
          ),
        ),
      ),
    );
  }
}

class _SupportAction extends StatelessWidget {
  const _SupportAction({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: AppPressable(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.dark
                      ? DiyorColors.sun.withValues(alpha: 0.16)
                      : DiyorColors.sun50,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: DiyorColors.sun, size: 20),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppText.caption.copyWith(color: context.diyor.ink, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late final TextEditingController _name;
  late final TextEditingController _phone;
  late final TextEditingController _whatsapp;
  late final TextEditingController _telegram;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authControllerProvider).user;
    _name = TextEditingController(text: user?.name ?? "");
    _phone = TextEditingController(text: user?.phone ?? "");
    _whatsapp = TextEditingController(text: user?.whatsapp ?? "");
    _telegram = TextEditingController(text: user?.telegram ?? "");
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _whatsapp.dispose();
    _telegram.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    try {
      await ref.read(apiClientProvider).updateMe({
        "name": _name.text.trim(),
        "phone": _phone.text.trim(),
        "whatsapp": _whatsapp.text.trim(),
        "telegram": _telegram.text.trim(),
      });
      await ref.read(authControllerProvider.notifier).refreshMe();
      if (mounted) context.pop();
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
    return Scaffold(
      body: Column(
        children: [
          AccountHeader(title: t.t("profile.edit"), showBack: true),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              children: [
                AccountGroup(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(14, 8, 14, 16),
                      child: Column(
                        children: [
                          TextField(controller: _name, decoration: InputDecoration(labelText: t.t("auth.name"))),
                          const SizedBox(height: 12),
                          TextField(controller: _phone, decoration: InputDecoration(labelText: t.t("auth.phone"))),
                          const SizedBox(height: 12),
                          TextField(controller: _whatsapp, decoration: InputDecoration(labelText: t.t("profile.whatsapp"))),
                          const SizedBox(height: 12),
                          TextField(controller: _telegram, decoration: InputDecoration(labelText: t.t("profile.telegram"))),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _loading ? null : _save,
                  child: Text(_loading ? t.t("common.loading") : t.t("common.save")),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class MyListingsScreen extends ConsumerStatefulWidget {
  const MyListingsScreen({super.key});

  @override
  ConsumerState<MyListingsScreen> createState() => _MyListingsScreenState();
}

class _MyListingsScreenState extends ConsumerState<MyListingsScreen> {
  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(t.t("profile.myListings"))),
      body: FutureBuilder<List<Listing>>(
        future: ref.read(apiClientProvider).myListings(),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const AppLoading();
          }
          if (snapshot.hasError) {
            return ErrorView(
              message: snapshot.error is ApiException
                  ? (snapshot.error as ApiException).message
                  : t.t("common.error"),
              onRetry: () => setState(() {}),
              retryLabel: t.t("common.retry"),
            );
          }
          final items = snapshot.data ?? [];
          if (items.isEmpty) {
            return EmptyView(
              message: t.t("common.empty"),
              actionLabel: t.t("add.title"),
              onAction: () => context.go("/add"),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final item = items[index];
              return AppCard(
                onTap: () => context.push("/ad/${item.id}"),
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: AppText.h3),
                          const SizedBox(height: 4),
                          Text(
                            "${listingStatusLabel(item.status)} · ${formatPrice(item.price)}",
                            style: AppText.caption,
                          ),
                        ],
                      ),
                    ),
                    PopupMenuButton<String>(
                      onSelected: (value) => _act(item, value, t),
                      itemBuilder: (context) => [
                        PopupMenuItem(value: "edit", child: Text(t.t("add.edit"))),
                        PopupMenuItem(value: "promote", child: Text(t.t("my.promote"))),
                        PopupMenuItem(value: "sold", child: Text(t.t("my.sold"))),
                        PopupMenuItem(value: "archive", child: Text(t.t("my.archive"))),
                        PopupMenuItem(value: "republish", child: Text(t.t("my.republish"))),
                      ],
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  Future<void> _act(Listing item, String value, AppStrings t) async {
    final api = ref.read(apiClientProvider);
    try {
      switch (value) {
        case "edit":
          if (mounted) context.push("/edit/${item.id}");
          return;
        case "sold":
          await api.markSold(item.id);
        case "archive":
          await api.archiveListing(item.id);
        case "republish":
          await api.republishListing(item.id);
        case "promote":
          await _promote(item);
          return;
      }
      setState(() {});
      ref.invalidate(myListingsProvider);
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
      }
    }
  }

  Future<void> _promote(Listing item) async {
    final t = ref.read(stringsProvider);
    final highlight = <({int amount, int price})>[];
    final packs = <({int amount, int price})>[];
    try {
      final settings = await ref.read(apiClientProvider).siteSettings();
      highlight.addAll(_settingPlans(settings["highlightPlans"], "days"));
      packs.addAll(_settingPlans(settings["bumpPackPlans"], "count"));
    } catch (_) {}
    if (!mounted) return;
    final plan = await showModalBottomSheet<(String, int)>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return ListView(
          children: [
            ListTile(title: Text(t.t("my.vip"), style: AppText.h3)),
            for (final plan in vipPlans)
              ListTile(
                title: Text("${plan.days} ${t.t("time.daysAgo").replaceAll("{{n}}", "").trim()} · ${plan.price} TJS"),
                onTap: () => Navigator.pop(context, ("vip", plan.days)),
              ),
            ListTile(title: Text(t.t("my.top"), style: AppText.h3)),
            for (final plan in topPlans)
              ListTile(
                title: Text("${plan.days} дн. · ${plan.price} TJS"),
                onTap: () => Navigator.pop(context, ("top", plan.days)),
              ),
            if (highlight.isNotEmpty) ListTile(title: Text(t.t("ads.highlight"), style: AppText.h3)),
            for (final plan in highlight)
              ListTile(
                title: Text("${plan.amount} дн. · ${plan.price} TJS"),
                onTap: () => Navigator.pop(context, ("highlight", plan.amount)),
              ),
            if (packs.isNotEmpty) ListTile(title: Text(t.t("ads.bumpPack"), style: AppText.h3)),
            for (final plan in packs)
              ListTile(
                title: Text("${plan.amount} шт. · ${plan.price} TJS"),
                onTap: () => Navigator.pop(context, ("bump_pack", plan.amount)),
              ),
          ],
        );
      },
    );
    if (plan == null) return;
    await ref.read(apiClientProvider).promoteListing(item.id, type: plan.$1, days: plan.$2);
    await ref.read(authControllerProvider.notifier).refreshMe();
    if (mounted) setState(() {});
  }
}

List<({int amount, int price})> _settingPlans(dynamic raw, String field) {
  if (raw is! List) return const [];
  final plans = <({int amount, int price})>[];
  for (final item in raw) {
    if (item is! Map) continue;
    final amount = int.tryParse("${item[field] ?? ""}".split(".").first) ?? 0;
    final price = num.tryParse("${item["price"] ?? ""}")?.round() ?? 0;
    if (amount > 0) plans.add((amount: amount, price: price));
  }
  return plans;
}

class SellerScreen extends ConsumerStatefulWidget {
  const SellerScreen({super.key, required this.id});

  final String id;

  @override
  ConsumerState<SellerScreen> createState() => _SellerScreenState();
}

class _SellerScreenState extends ConsumerState<SellerScreen> {
  int _retry = 0;

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(t.t("seller.listings"))),
      body: FutureBuilder(
        key: ValueKey(_retry),
        future: Future.wait([
          ref.read(apiClientProvider).sellerPublic(widget.id),
          ref.read(apiClientProvider).listings(owner: widget.id, limit: 50),
        ]),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const AppLoading();
          }
          if (snapshot.hasError) {
            return ErrorView(
              message: t.t("common.error"),
              onRetry: () => setState(() => _retry++),
              retryLabel: t.t("common.retry"),
            );
          }
          final seller = snapshot.data![0] as SellerProfile;
          final listings = snapshot.data![1] as List<Listing>;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              AppCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(seller.displayName, style: AppText.h1),
                    const SizedBox(height: 4),
                    Text(t.t("profile.listingsCount", {"count": "${seller.listingsCount}"}), style: AppText.caption),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: ListingGridDelegate.of(context),
                itemCount: listings.length,
                itemBuilder: (context, index) {
                  return ListingCard(item: listings[index], strings: t);
                },
              ),
            ],
          );
        },
      ),
    );
  }
}
