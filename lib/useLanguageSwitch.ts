'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'de', 'zh', 'ja'];

export function useLanguageSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const changeLanguage = (newLocale: string) => {
    if (!SUPPORTED_LOCALES.includes(newLocale)) return;
    // Remove current locale from pathname using precise start-of-path match
    const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '') || '/';
    
    // Navigate to new locale
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return { locale, changeLanguage };
}
