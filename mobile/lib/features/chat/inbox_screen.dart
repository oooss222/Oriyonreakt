import "package:cached_network_image/cached_network_image.dart";
import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../api/api_exception.dart";
import "../../l10n/strings.dart";
import "../../models/message.dart";
import "../../state/providers.dart";
import "../../theme.dart";
import "../../utils/format.dart";
import "../../utils/media.dart";
import "../../utils/nav.dart";
import "../../widgets/common.dart";

class InboxScreen extends ConsumerStatefulWidget {
  const InboxScreen({super.key});

  @override
  ConsumerState<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends ConsumerState<InboxScreen> {
  final _search = TextEditingController();
  String _filter = "all";
  bool _loading = true;
  String? _error;
  List<ChatMessage> _active = [];
  List<ChatMessage> _archived = [];

  @override
  void initState() {
    super.initState();
    _search.addListener(() => setState(() {}));
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (!ref.read(authControllerProvider).isLoggedIn) {
      setState(() {
        _loading = false;
        _error = null;
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    final t = ref.read(stringsProvider);
    final api = ref.read(apiClientProvider);
    try {
      final results = await Future.wait([
        api.inbox(),
        api.inbox(archived: true),
      ]);
      if (!mounted) return;
      setState(() {
        _active = results[0];
        _archived = results[1];
        _loading = false;
      });
      ref.invalidate(unreadCountProvider);
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.isNetwork ? t.t("common.offline") : error.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = t.t("common.error");
        _loading = false;
      });
    }
  }

  List<ChatMessage> _visible(String myId, Set<String> starred) {
    var items = _filter == "archived" ? _archived : _active;
    if (_filter == "unread") {
      items = items.where((item) => item.unreadCount > 0).toList();
    } else if (_filter == "starred") {
      items = items.where((item) => starred.contains(item.threadKey(myId))).toList();
    }
    final q = _search.text.trim().toLowerCase();
    if (q.isEmpty) return items;
    return items.where((item) {
      final title = _rowTitle(item, myId, ref.read(stringsProvider)).toLowerCase();
      final peer = item.peerName(myId).toLowerCase();
      return title.contains(q) || peer.contains(q) || item.text.toLowerCase().contains(q);
    }).toList();
  }

  String _rowTitle(ChatMessage item, String myId, AppStrings t) {
    if (item.isSupport) return t.t("chat.support");
    if (item.listingTitle.trim().isNotEmpty) return item.listingTitle.trim();
    final peer = item.peerName(myId);
    return peer.isEmpty ? t.t("listing.noTitle") : peer;
  }

  String _preview(ChatMessage item, String myId, AppStrings t) {
    final body = item.text.trim().isNotEmpty
        ? item.text.trim()
        : (item.attachmentUrl.isNotEmpty ? t.t("chat.photo") : "");
    if (body.isEmpty) return "";
    if (item.senderId == myId) return "${t.t("chat.you")}: $body";
    return body;
  }

  String _emptyMessage(AppStrings t) {
    if (_search.text.trim().isNotEmpty) return t.t("chat.emptySearch");
    return switch (_filter) {
      "unread" => t.t("chat.emptyUnread"),
      "starred" => t.t("chat.emptyStarred"),
      "archived" => t.t("chat.emptyArchive"),
      _ => t.t("chat.emptyInbox"),
    };
  }

  Future<void> _openThread(ChatMessage item, String myId) async {
    final t = ref.read(stringsProvider);
    await context.push(
      listingThreadLocation(
        listingId: item.listingId,
        peerId: item.peerId(myId),
        title: _rowTitle(item, myId, t),
      ),
    );
    if (mounted) _load();
  }

  Future<void> _actions(ChatMessage item, String myId) async {
    final t = ref.read(stringsProvider);
    final starred = ref.read(chatStarredControllerProvider);
    final key = item.threadKey(myId);
    final isStarred = starred.contains(key);
    final archived = _filter == "archived" || item.threadArchived;
    final action = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: Icon(isStarred ? Icons.star_rounded : Icons.star_border_rounded),
                title: Text(t.t(isStarred ? "chat.unstar" : "chat.star")),
                onTap: () => Navigator.pop(context, "star"),
              ),
              ListTile(
                leading: Icon(archived ? Icons.unarchive_outlined : Icons.archive_outlined),
                title: Text(t.t(archived ? "chat.unarchive" : "chat.archive")),
                onTap: () => Navigator.pop(context, "archive"),
              ),
            ],
          ),
        );
      },
    );
    if (action == "star") {
      await ref.read(chatStarredControllerProvider.notifier).toggle(key);
      return;
    }
    if (action != "archive") return;
    try {
      await ref.read(apiClientProvider).patchThread(
            listingId: item.listingId,
            peerId: item.peerId(myId),
            archived: !archived,
          );
      await _load();
    } on ApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final auth = ref.watch(authControllerProvider);
    ref.listen(authControllerProvider, (previous, next) {
      if (next.isLoggedIn && previous?.isLoggedIn != true) {
        _load();
      }
    });
    final starred = auth.isLoggedIn ? ref.watch(chatStarredControllerProvider) : const <String>{};
    final dark = Theme.of(context).brightness == Brightness.dark;
    final myId = auth.user?.id ?? "";
    final unread = _active.fold<int>(0, (sum, item) => sum + item.unreadCount);
    final items = auth.isLoggedIn ? _visible(myId, starred) : const <ChatMessage>[];

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      child: Material(
        color: context.diyor.canvas,
        child: Column(
          children: [
            _InboxHeader(
              title: t.t("chat.title"),
              onCompose: () {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t.t("chat.newHint"))));
                context.push("/catalog");
              },
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: _ChatSearchField(controller: _search, hint: t.t("chat.search")),
            ),
            if (auth.isLoggedIn)
              SizedBox(
                height: 40,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    _FilterChip(
                      label: t.t("chat.filterAll"),
                      selected: _filter == "all",
                      count: unread,
                      onTap: () => setState(() => _filter = "all"),
                    ),
                    _FilterChip(
                      label: t.t("chat.filterUnread"),
                      selected: _filter == "unread",
                      count: unread,
                      showCountWhenUnselected: true,
                      onTap: () => setState(() => _filter = "unread"),
                    ),
                    _FilterChip(
                      label: t.t("chat.filterStarred"),
                      selected: _filter == "starred",
                      onTap: () => setState(() => _filter = "starred"),
                    ),
                    _FilterChip(
                      label: t.t("chat.filterArchive"),
                      selected: _filter == "archived",
                      onTap: () => setState(() => _filter = "archived"),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 6),
            Expanded(
              child: auth.loading
                  ? const AppLoading()
                  : !auth.isLoggedIn
                      ? LoginGate(message: t.t("auth.needLogin"), actionLabel: t.t("nav.login"))
                      : RefreshIndicator(
                      color: DiyorColors.sun,
                      onRefresh: _load,
                      child: _loading && _active.isEmpty && _archived.isEmpty
                          ? ListView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              children: const [
                                SizedBox(height: 120, child: AppLoading()),
                              ],
                            )
                          : _error != null && items.isEmpty
                              ? ListView(
                                  physics: const AlwaysScrollableScrollPhysics(),
                                  children: [
                                    SizedBox(
                                      height: 280,
                                      child: ErrorView(
                                        message: _error!,
                                        onRetry: _load,
                                        retryLabel: t.t("common.retry"),
                                      ),
                                    ),
                                  ],
                                )
                              : items.isEmpty
                                  ? ListView(
                                      physics: const AlwaysScrollableScrollPhysics(),
                                      children: [
                                        SizedBox(
                                          height: 280,
                                          child: EmptyView(
                                            message: _emptyMessage(t),
                                            icon: Icons.chat_bubble_outline_rounded,
                                          ),
                                        ),
                                      ],
                                    )
                                  : ListView.builder(
                                      physics: const AlwaysScrollableScrollPhysics(),
                                      padding: EdgeInsets.only(bottom: AppSpace.belowNav(context)),
                                      itemCount: items.length,
                                      itemBuilder: (context, index) {
                                        final item = items[index];
                                        return _ChatRow(
                                          item: item,
                                          title: _rowTitle(item, myId, t),
                                          preview: _preview(item, myId, t),
                                          time: formatInboxTime(item.createdAt, t: t.t),
                                          mine: item.senderId == myId,
                                          onTap: () => _openThread(item, myId),
                                          onLongPress: () => _actions(item, myId),
                                        );
                                      },
                                    ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InboxHeader extends StatelessWidget {
  const _InboxHeader({required this.title, required this.onCompose});

  final String title;
  final VoidCallback onCompose;

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, top + 8, 16, 12),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: AppText.h1.copyWith(fontSize: 28, letterSpacing: -0.6),
            ),
          ),
          Material(
            color: context.diyor.surface,
            elevation: 1,
            shadowColor: const Color(0x14000000),
            borderRadius: BorderRadius.circular(12),
            child: InkWell(
              onTap: () {
                HapticFeedback.selectionClick();
                onCompose();
              },
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 40,
                height: 40,
                child: Icon(Icons.edit_square, size: 20, color: context.diyor.ink),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatSearchField extends StatelessWidget {
  const _ChatSearchField({required this.controller, required this.hint});

  final TextEditingController controller;
  final String hint;

  @override
  Widget build(BuildContext context) {
    final palette = context.diyor;
    final fill = Theme.of(context).brightness == Brightness.dark
        ? palette.chip
        : const Color(0xFFE8EBEE);
    return TextField(
      controller: controller,
      textInputAction: TextInputAction.search,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: palette.muted, fontWeight: FontWeight.w500, fontSize: 15),
        prefixIcon: Icon(Icons.search_rounded, color: palette.muted),
        filled: true,
        fillColor: fill,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        border: OutlineInputBorder(borderRadius: AppRadii.pill, borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(borderRadius: AppRadii.pill, borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(borderRadius: AppRadii.pill, borderSide: BorderSide.none),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.count = 0,
    this.showCountWhenUnselected = false,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final int count;
  final bool showCountWhenUnselected;

  @override
  Widget build(BuildContext context) {
    final showBadge = count > 0 && (selected || showCountWhenUnselected);
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Material(
        color: selected
            ? context.diyor.ink
            : (Theme.of(context).brightness == Brightness.dark
                ? context.diyor.chip
                : const Color(0xFFEEF0F3)),
        borderRadius: AppRadii.pill,
        child: InkWell(
          onTap: onTap,
          borderRadius: AppRadii.pill,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 8, 14, 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: selected ? context.diyor.canvas : context.diyor.ink,
                  ),
                ),
                if (showBadge) ...[
                  const SizedBox(width: 6),
                  Container(
                    constraints: const BoxConstraints(minWidth: 18),
                    height: 18,
                    padding: const EdgeInsets.symmetric(horizontal: 5),
                    decoration: const BoxDecoration(
                      color: Color(0xFF22C55E),
                      borderRadius: BorderRadius.all(Radius.circular(99)),
                    ),
                    child: Center(
                      child: Text(
                        count > 99 ? "99+" : "$count",
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          height: 1.1,
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ChatRow extends StatelessWidget {
  const _ChatRow({
    required this.item,
    required this.title,
    required this.preview,
    required this.time,
    required this.mine,
    required this.onTap,
    required this.onLongPress,
  });

  final ChatMessage item;
  final String title;
  final String preview;
  final String time;
  final bool mine;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  @override
  Widget build(BuildContext context) {
    final unread = item.unreadCount > 0;
    final thumb = resolveMediaUrl(item.listingImage, width: 160);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
          child: Row(
            children: [
              _ChatAvatar(name: title, imageUrl: thumb, support: item.isSupport),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: unread ? FontWeight.w800 : FontWeight.w700,
                              color: context.diyor.ink,
                              height: 1.2,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          time,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: unread ? FontWeight.w700 : FontWeight.w600,
                            color: unread ? DiyorColors.sun600 : context.diyor.muted,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        if (mine && !unread) ...[
                          Icon(
                            Icons.done_all_rounded,
                            size: 16,
                            color: item.isRead ? const Color(0xFF34B7F1) : context.diyor.muted,
                          ),
                          const SizedBox(width: 4),
                        ],
                        Expanded(
                          child: Text(
                            preview,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: unread ? FontWeight.w600 : FontWeight.w500,
                              color: unread ? context.diyor.ink : context.diyor.muted,
                            ),
                          ),
                        ),
                        if (unread) ...[
                          const SizedBox(width: 8),
                          Container(
                            constraints: const BoxConstraints(minWidth: 20),
                            height: 20,
                            padding: const EdgeInsets.symmetric(horizontal: 6),
                            decoration: const BoxDecoration(
                              color: Color(0xFF22C55E),
                              borderRadius: BorderRadius.all(Radius.circular(99)),
                            ),
                            child: Center(
                              child: Text(
                                item.unreadCount > 99 ? "99+" : "${item.unreadCount}",
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChatAvatar extends StatelessWidget {
  const _ChatAvatar({
    required this.name,
    required this.imageUrl,
    required this.support,
  });

  final String name;
  final String imageUrl;
  final bool support;

  @override
  Widget build(BuildContext context) {
    if (support) {
      return CircleAvatar(
        radius: 28,
        backgroundColor: context.diyor.chip,
        child: Icon(Icons.apartment_rounded, color: context.diyor.muted),
      );
    }
    if (imageUrl.isNotEmpty) {
      return CircleAvatar(
        radius: 28,
        backgroundColor: context.diyor.placeholder,
        backgroundImage: CachedNetworkImageProvider(imageUrl),
      );
    }
    final initial = name.trim().isEmpty ? "?" : name.trim().characters.first.toUpperCase();
    return CircleAvatar(
      radius: 28,
      backgroundColor: DiyorColors.lagoon,
      child: Text(
        initial,
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18),
      ),
    );
  }
}
