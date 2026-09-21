class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.listingId,
    required this.senderId,
    required this.receiverId,
    required this.text,
    this.attachmentUrl = "",
    this.isRead = false,
    this.unreadCount = 0,
    this.listingTitle = "",
    this.listingImage = "",
    this.listingPrice,
    this.listingOwner,
    this.senderName = "",
    this.receiverName = "",
    this.createdAt,
    this.threadArchived = false,
    this.threadMuted = false,
  });

  final String id;
  final String listingId;
  final String senderId;
  final String receiverId;
  final String text;
  final String attachmentUrl;
  final bool isRead;
  final int unreadCount;
  final String listingTitle;
  final String listingImage;
  final String? listingPrice;
  final String? listingOwner;
  final String senderName;
  final String receiverName;
  final DateTime? createdAt;
  final bool threadArchived;
  final bool threadMuted;

  String peerId(String myId) {
    return senderId == myId ? receiverId : senderId;
  }

  String peerName(String myId) {
    final name = senderId == myId ? receiverName : senderName;
    return name.trim();
  }

  String threadKey(String myId) => "$listingId|${peerId(myId)}";

  bool get isSupport {
    final title = listingTitle.toLowerCase();
    return title.contains("diyor premium") ||
        title.contains("diyor бизнес") ||
        title.contains("консультация") ||
        title.contains("поддержка");
  }

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    final nested = json["message"];
    final source = nested is Map ? Map<String, dynamic>.from(nested) : json;
    return ChatMessage(
      id: "${source["id"] ?? source["_id"] ?? ""}",
      listingId: "${source["listingId"] ?? json["listingId"] ?? ""}",
      senderId: "${source["senderId"] ?? ""}",
      receiverId: "${source["receiverId"] ?? ""}",
      text: "${source["text"] ?? ""}",
      attachmentUrl: "${source["attachmentUrl"] ?? ""}",
      isRead: source["isRead"] == true,
      unreadCount: int.tryParse("${source["unreadCount"] ?? 0}") ?? 0,
      listingTitle: "${source["listingTitle"] ?? ""}",
      listingImage: "${source["listingImage"] ?? ""}",
      listingPrice: source["listingPrice"]?.toString(),
      listingOwner: source["listingOwner"]?.toString(),
      senderName: "${source["senderName"] ?? ""}",
      receiverName: "${source["receiverName"] ?? ""}",
      createdAt: DateTime.tryParse("${source["createdAt"] ?? ""}"),
      threadArchived: source["threadArchived"] == true,
      threadMuted: source["threadMuted"] == true,
    );
  }
}

class WalletTx {
  const WalletTx({
    required this.id,
    required this.amount,
    this.type = "",
    this.note = "",
    this.createdAt,
  });

  final String id;
  final double amount;
  final String type;
  final String note;
  final DateTime? createdAt;

  factory WalletTx.fromJson(Map<String, dynamic> json) {
    return WalletTx(
      id: "${json["id"] ?? json["_id"] ?? ""}",
      amount: double.tryParse("${json["amount"] ?? 0}") ?? 0,
      type: "${json["type"] ?? json["kind"] ?? ""}",
      note: "${json["note"] ?? json["description"] ?? json["comment"] ?? ""}",
      createdAt: DateTime.tryParse("${json["createdAt"] ?? json["created_at"] ?? ""}"),
    );
  }
}
