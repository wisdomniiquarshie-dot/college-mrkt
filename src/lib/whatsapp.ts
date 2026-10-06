import { formatWhatsAppNumber } from "./marketplace";

export function getWhatsAppLink(phone: string, itemTitle: string) {
  const formattedPhone = formatWhatsAppNumber(phone);

  if (!formattedPhone) {
    return null;
  }

  const message = encodeURIComponent(
    `Hi! I saw your listing for "${itemTitle}" on COLLEGE MRKT.`
  );

  return `https://wa.me/${formattedPhone}?text=${message}`;
}