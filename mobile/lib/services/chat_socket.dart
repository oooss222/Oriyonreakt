import "package:socket_io_client/socket_io_client.dart" as io;

import "../config.dart";

class ChatSocket {
  io.Socket? _socket;
  String? _token;

  io.Socket? get socket => _socket;

  void connect(String token) {
    if (token.isEmpty) {
      disconnect();
      return;
    }
    if (_socket?.connected == true && _token == token) return;

    disconnect();
    _token = token;
    _socket = io.io(
      AppConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(["websocket"])
          .setPath("/socket.io")
          .setAuth({"token": token})
          .enableReconnection()
          .build(),
    );
    _socket!.connect();
  }

  void disconnect() {
    _socket?.dispose();
    _socket = null;
    _token = null;
  }
}
