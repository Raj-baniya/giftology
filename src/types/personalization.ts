export interface GiftPersonalization {
  recipientName: string;
  giftMessage?: string;
  wrapStyle?: 'CLASSIC' | 'PREMIUM' | 'ECO';
  cardTemplateId?: string;
}
