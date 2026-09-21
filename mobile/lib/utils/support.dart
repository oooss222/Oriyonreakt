import "package:flutter/material.dart";
import "package:go_router/go_router.dart";
import "package:url_launcher/url_launcher.dart";

import "../api/api_client.dart";
import "../config.dart";
import "nav.dart";

const supportChatTitle = "Поддержка Diyor";
const premiumChatTitle = "Diyor Premium — консультация";
const premiumChatDraft =
    "Здравствуйте! Интересует премиум-аккаунт Diyor Premium. Подскажите, пожалуйста, условия подключения.";

Future<void> openSupportMail({String subject = "Diyor"}) {
  final uri = Uri(
    scheme: "mailto",
    path: AppConfig.supportEmail,
    queryParameters: {"subject": subject},
  );
  return launchUrl(uri);
}

Future<void> openSupportChat(
  BuildContext context,
  ApiClient api, {
  String title = supportChatTitle,
}) async {
  try {
    final contact = await api.businessSupportContact();
    final listingId = "${contact["listingId"] ?? ""}";
    final peerId = "${contact["adminId"] ?? ""}";
    if (listingId.isEmpty || peerId.isEmpty) {
      throw StateError("empty contact");
    }
    if (!context.mounted) return;
    context.push(
      listingThreadLocation(listingId: listingId, peerId: peerId, title: title),
    );
  } catch (_) {
    await openSupportMail(subject: title);
  }
}
