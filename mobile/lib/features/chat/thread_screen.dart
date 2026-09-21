import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../api/api_exception.dart";
import "../../models/message.dart";
import "../../state/chat_providers.dart";
import "../../state/providers.dart";
import "../../theme.dart";
import "../../utils/format.dart";
import "../../widgets/common.dart";

class ChatThreadScreen extends ConsumerStatefulWidget {
  const ChatThreadScreen({
    super.key,
    required this.listingId,
    required this.peerId,
    this.title = "",
  });

  final String listingId;
  final String peerId;
  final String title;

  @override
  ConsumerState<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends ConsumerState<ChatThreadScreen> {
  final _text = TextEditingController();
  final _scroll = ScrollController();
  final _freshIds = <String>{};
  List<ChatMessage> _messages = [];
  bool _loading = true;
  String? _error;
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _load();
    WidgetsBinding.instance.addPostFrameCallback((_) => _listenSocket());
  }

  @override
  void dispose() {
    _text.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _listenSocket() {
    final socket = ref.read(chatSocketProvider).socket;
    socket?.on("message:new", (data) {
      if (data is! Map) return;
      final message = ChatMessage.fromJson(Map<String, dynamic>.from(data));
      if (message.listingId != widget.listingId) return;
      final mine = ref.read(authControllerProvider).user?.id;
      if (message.senderId != widget.peerId && message.senderId != mine) return;
      _append(message);
    });
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await ref.read(apiClientProvider).thread(
            listingId: widget.listingId,
            peerId: widget.peerId,
          );
      setState(() {
        _messages = items;
        _loading = false;
      });
      _jump();
    } on ApiException catch (error) {
      setState(() {
        _error = error.message;
        _loading = false;
      });
    }
  }

  void _append(ChatMessage message) {
    if (message.id.isNotEmpty && _messages.any((item) => item.id == message.id)) return;
    setState(() {
      _messages = [..._messages, message];
      if (message.id.isNotEmpty) _freshIds.add(message.id);
    });
    _jump();
  }

  void _jump() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      final target = _scroll.position.maxScrollExtent;
      if (AppMotion.reduce(context)) {
        _scroll.jumpTo(target);
        return;
      }
      _scroll.animateTo(target, duration: AppMotion.fast, curve: AppMotion.enter);
    });
  }

  Future<void> _send() async {
    final text = _text.text.trim();
    if (text.isEmpty) return;
    _text.clear();
    setState(() => _sending = true);
    try {
      final created = await ref.read(apiClientProvider).sendMessage(
            listingId: widget.listingId,
            receiverId: widget.peerId,
            text: text,
          );
      _append(created);
      ref.invalidate(unreadCountProvider);
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(stringsProvider);
    final myId = ref.watch(authControllerProvider).user?.id ?? "";
    return Scaffold(
      appBar: AppBar(
        title: GestureDetector(
          onTap: () => context.push("/ad/${widget.listingId}"),
          child: Text(widget.title.isEmpty ? t.t("nav.chat") : widget.title),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const AppLoading()
                : _error != null
                    ? ErrorView(message: _error!, onRetry: _load, retryLabel: t.t("common.retry"))
                    : _messages.isEmpty
                        ? EmptyView(message: t.t("chat.empty"), icon: Icons.chat_bubble_outline)
                        : ListView.builder(
                            controller: _scroll,
                            padding: const EdgeInsets.all(16),
                            itemCount: _messages.length,
                            itemBuilder: (context, index) {
                              final msg = _messages[index];
                              final mine = msg.senderId == myId;
                              Widget bubble = Align(
                                alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 6),
                                  constraints: BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * 0.78),
                                  decoration: BoxDecoration(
                                    color: mine ? DiyorColors.sun : context.diyor.surface,
                                    borderRadius: BorderRadius.only(
                                      topLeft: const Radius.circular(18),
                                      topRight: const Radius.circular(18),
                                      bottomLeft: Radius.circular(mine ? 18 : 6),
                                      bottomRight: Radius.circular(mine ? 6 : 18),
                                    ),
                                    boxShadow: mine ? null : AppShadows.soft,
                                    border: mine ? null : Border.all(color: context.diyor.line),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        msg.text,
                                        style: TextStyle(
                                          color: mine ? Colors.white : context.diyor.ink,
                                          height: 1.35,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        formatMessageTime(msg.createdAt),
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: mine ? Colors.white70 : context.diyor.muted,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                              if (_freshIds.contains(msg.id)) {
                                bubble = AppAppear(offset: 8, child: bubble);
                              }
                              return bubble;
                            },
                          ),
          ),
          DecoratedBox(
            decoration: BoxDecoration(
              color: context.diyor.surface,
              border: Border(top: BorderSide(color: context.diyor.line)),
            ),
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _text,
                        minLines: 1,
                        maxLines: 4,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _send(),
                        decoration: InputDecoration(
                          hintText: t.t("chat.hint"),
                          filled: true,
                          fillColor: context.diyor.chip,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    AnimatedScale(
                      scale: _sending ? 0.9 : 1,
                      duration: AppMotion.of(context, AppMotion.micro),
                      curve: AppMotion.pop,
                      child: IconButton.filled(
                        onPressed: _send,
                        style: IconButton.styleFrom(
                          backgroundColor: DiyorColors.sun,
                          foregroundColor: Colors.white,
                          minimumSize: const Size(44, 44),
                        ),
                        icon: const Icon(Icons.send_rounded),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
