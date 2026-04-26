export interface GuestUsage {
  date: string;
  textCount: number;
  imageCount: number;
}

const STORAGE_KEY = 'loki_guest_usage';
const MAX_TEXT = 20;
const MAX_IMAGES = 5;

const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

export const getGuestUsage = (): GuestUsage => {
  const data = localStorage.getItem(STORAGE_KEY);
  const today = getTodayString();

  if (data) {
    try {
      const usage: GuestUsage = JSON.parse(data);
      if (usage.date === today) {
        return usage;
      }
    } catch (e) {
      console.error('Failed to parse guest usage', e);
    }
  }

  return { date: today, textCount: 0, imageCount: 0 };
};

const saveGuestUsage = (usage: GuestUsage) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
};

export const incrementTextCount = (): boolean => {
  const usage = getGuestUsage();
  if (usage.textCount >= MAX_TEXT) {
    return false; // Limit reached
  }
  usage.textCount += 1;
  saveGuestUsage(usage);
  return true;
};

export const incrementImageCount = (): boolean => {
  const usage = getGuestUsage();
  if (usage.imageCount >= MAX_IMAGES) {
    return false; // Limit reached
  }
  usage.imageCount += 1;
  saveGuestUsage(usage);
  return true;
};

export const canSendTextMessage = (): boolean => {
  const usage = getGuestUsage();
  return usage.textCount < MAX_TEXT;
};

export const canGenerateImage = (): boolean => {
  const usage = getGuestUsage();
  return usage.imageCount < MAX_IMAGES;
};

export const getRemainingTextMessages = (): number => {
    const usage = getGuestUsage();
    return Math.max(0, MAX_TEXT - usage.textCount);
};

export const getRemainingImageGenerations = (): number => {
    const usage = getGuestUsage();
    return Math.max(0, MAX_IMAGES - usage.imageCount);
}
