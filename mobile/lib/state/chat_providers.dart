import "package:flutter_riverpod/flutter_riverpod.dart";

import "../services/chat_socket.dart";

final chatSocketProvider = Provider<ChatSocket>((ref) {
  final socket = ChatSocket();
  ref.onDispose(socket.disconnect);
  return socket;
});
