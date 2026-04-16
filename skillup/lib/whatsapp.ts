import { Linking, Alert } from 'react-native';

/**
 * Open WhatsApp chat to the given phone number.
 * Strips non-digit characters before building the wa.me URL.
 */
export async function openWhatsApp(
  phone: string,
  message?: string
): Promise<void> {
  const digits = phone.replace(/\D/g, '');
  const encodedMessage = message
    ? `?text=${encodeURIComponent(message)}`
    : '';
  const url = `https://wa.me/${digits}${encodedMessage}`;

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    Alert.alert(
      'WhatsApp not installed',
      'Please install WhatsApp to message this provider.',
      [{ text: 'OK' }]
    );
  }
}
