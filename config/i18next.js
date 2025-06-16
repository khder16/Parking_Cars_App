import i18next from "i18next";
import i18nextMiddleware from "i18next-http-middleware";
import Backend from "i18next-fs-backend";

export const initializeI18n = async () => {
  try {
    await i18next
      .use(Backend)
      .use(i18nextMiddleware.LanguageDetector)
      .init({
        fallbackLng: "en",
        preload: ["en", "ar"],
        backend: {
          loadPath: "./locales/{{lng}}/{{ns}}.json", // More structured path
        },
        // debug: true,
        ns: ["admin", "auth", "common", "orders", "repair", "parking", "user"],
        detection: {
          order: ["header", "cookie", "querystring"],
          caches: ["cookie"],
          lookupCookie: "i18next",
          lookupQuerystring: "lang",
          lookupHeader: "lang",
        },
        interpolation: {
          escapeValue: false, // React already protects against XSS
        },
        saveMissing: true, // Save missing translations
        missingKeyHandler: (lng, ns, key) => {
          console.warn(`Missing translation: ${lng}.${ns}.${key}`);
        },
      });
    return {
      i18next,
      middleware: i18nextMiddleware.handle(i18next),
    };
  } catch (error) {
    console.error("i18n initialization failed:", error);
    throw error;
  }
};
