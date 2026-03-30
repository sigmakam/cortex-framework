# DataLayer — Instrukcja implementacji dla Cortex Framework

> Dokument techniczny dla Claude Code / AI agenta.
> Źródło: Specyfikacja Warstwy Danych 7p.marketing OÜ v1.0, przerobiona na kontekst Cortex Framework.
> Nie stosujemy `[ZMIENNYCH]` — wszystkie wartości pochodzą z `site_config` w DB przez `SiteContext`.
>
> **KONWENCJA NAZEWNICTWA: snake_case dla WSZYSTKICH eventów i parametrów.**
> Zgodne z GA4 recommended events. Bez wyjątków.

---

## 0. Cel dokumentu

Ten dokument jest **jedyną instrukcją** do wdrożenia warstwy danych (dataLayer) w Cortex Framework. Deweloper (lub AI agent) implementujący tę specyfikację MUSI:

1. Stworzyć typy TypeScript dla wszystkich zdarzeń dataLayer
2. Rozbudować `src/core/data-layer.ts` o logikę anonimizacji, consent mode, e-commerce clearing
3. Stworzyć React hooki i komponenty do wyzwalania zdarzeń
4. Poprawić kolejność ładowania GTM w `<head>`
5. Zintegrować zdarzenia z istniejącym Event Bus Cortex

**NIE generuj kodu z `[NAWIASAMI]`.** Każda wartość dynamiczna pochodzi z:
- `siteConfigService.get()` — dane firmy, kontakt, SEO, analytics z DB
- Props komponentów — dane specyficzne dla danego elementu UI

---

## 1. Architektura w Cortex

### 1.1 Warstwa Consent → DataLayer → GTM

```
<head>
  1. window.dataLayer = []              ← inicjalizacja
  2. gtag('consent', 'default', {...})  ← consent defaults (regiony z DB)
  3. GTM snippet                         ← ładuje GTM kontener
     └── GTM ładuje CMP (np. Cookiebot) jako tag
         └── CMP pokazuje baner → user akceptuje → consent update → tagi się odblokują
</head>
```

Cortex jest CMP-agnostyczny. CMP konfigurowany w GTM, nie w kodzie.

### 1.2 Istniejące pliki do ZMODYFIKOWANIA

```
src/core/data-layer.ts               ← Rozbudować o walidację, anonimizację
src/core/types.ts                    ← Dodać typy DataLayer events
src/components/DataLayerProvider.tsx  ← Rozbudować o hooki per kategoria zdarzeń
src/components/GTMScript.tsx         ← Przepisać: consent defaults → GTM snippet
src/app/layout.tsx                   ← Zaktualizować kolejność skryptów w <head>
```

### 1.3 Nowe pliki do STWORZENIA

```
src/core/datalayer/
  types.ts                ← Typy dla wszystkich zdarzeń (interface per event)
  anonymize.ts            ← Funkcje anonimizacji telefonu i emaila
  consent.ts              ← Consent Mode v2 — generowanie consent defaults z DB
  validators.ts           ← Walidacja parametrów przed push

src/hooks/datalayer/
  useContactTracking.ts   ← phone_click, phone_copy, email_click, email_copy
  useEngagement.ts        ← page_view_1s/2s/30s/120s, page_view_contact, page_view_count_5
  useFormTracking.ts      ← form_start, form_submit, form_sent_*, form_error
  useButtonTracking.ts    ← button_click, show_expander
  useSearchTracking.ts    ← search
  useEcommerce.ts         ← view_item_list, select_item, view_item, add_to_cart, remove_from_cart, begin_checkout, purchase, refund
  usePromoTracking.ts     ← view_promotion, select_promotion

src/components/tracking/
  TrackedPhoneLink.tsx    ← <a href="tel:"> z auto-tracking
  TrackedEmailLink.tsx    ← <a href="mailto:"> z auto-tracking
  TrackedButton.tsx       ← <button> z auto-tracking
  TrackedForm.tsx         ← Wrapper formularza z lejkiem form_start → form_submit → form_sent/form_error
  TrackedExpander.tsx     ← Akordeon/FAQ z auto-tracking show_expander
  EngagementTracker.tsx   ← Komponent mount-and-forget dla page_view_* events
```

### 1.4 Przepływ danych

```
[Użytkownik klika] → TrackedComponent → useXxxTracking() hook
                                              ↓
                                    DataLayerProvider.pushEvent()
                                              ↓
                                    window.dataLayer.push({...})
                                              ↓
                                    GTM przetwarza zdarzenie (FIFO)
                                              ↓
                              (tylko jeśli consent granted)
                                              ↓
                                    GA4 / Google Ads / Meta Pixel
```

---

## 2. Typy — `src/core/datalayer/types.ts`

**ZASADA: Wszystkie nazwy eventów i parametrów w snake_case. Bez wyjątków.**

```typescript
// src/core/datalayer/types.ts

// === Bazowe ===

interface BaseDataLayerEvent {
  event: string
}

interface SectionEvent extends BaseDataLayerEvent {
  section: string  // 'header' | 'footer' | 'contact' | 'blog' | 'product' | 'faq'
}

// === 3.1 Interakcje kontaktowe ===

interface PhoneClickEvent extends SectionEvent {
  event: 'phone_click'
  phone_number: string  // ZANONIMIZOWANY: +48711xxxxx33
}

interface PhoneCopyEvent extends SectionEvent {
  event: 'phone_copy'
  phone_number: string
}

interface EmailClickEvent extends SectionEvent {
  event: 'email_click'
  email: string  // TYLKO część przed @: 'biuro'
}

interface EmailCopyEvent extends SectionEvent {
  event: 'email_copy'
  email: string
}

// === 3.2 Zaangażowanie ===
// Bez dodatkowych parametrów. JEDNOKROTNIE per sesja (cookie 1 rok).

interface PageViewTimedEvent extends BaseDataLayerEvent {
  event: 'page_view_1s' | 'page_view_2s' | 'page_view_30s' | 'page_view_120s'
}

interface PageViewContactEvent extends BaseDataLayerEvent {
  event: 'page_view_contact'
}

interface PageViewCountEvent extends BaseDataLayerEvent {
  event: 'page_view_count_5'
}

// === 3.3 Formularze ===

interface FormStartEvent extends SectionEvent {
  event: 'form_start'
  form_name: string
}

interface FormSubmitEvent extends SectionEvent {
  event: 'form_submit'
  form_name: string
}

/**
 * KRYTYCZNE: form_sent_* to zdarzenie KONWERSYJNE.
 * Wysyłać TYLKO po sukcesie serwera (HTTP 200), NIE przy kliknięciu przycisku.
 */
interface FormSentEvent extends SectionEvent {
  event: `form_sent_${string}`
  form_name: string
}

interface FormErrorEvent extends SectionEvent {
  event: 'form_error'
  form_name: string
  error_type: string   // komunikat błędu: 'podaj adres email'
  error_field: string  // nazwa pola: 'email'
}

// === 3.4 UI / Zaawansowane ===

interface ButtonClickEvent extends SectionEvent {
  event: 'button_click'
  form_name: string  // tekst lub ID przycisku: 'umow_wizyte'
}

/** Wysyłać TYLKO przy rozwijaniu, NIE przy zwijaniu */
interface ShowExpanderEvent extends SectionEvent {
  event: 'show_expander'
  form_name: string  // tytuł akordeonu
}

interface SearchEvent extends BaseDataLayerEvent {
  event: 'search'
  search_term: string
}

// === 4. E-commerce (GA4 standard) ===

interface EcommerceItem {
  item_id: string
  item_name: string
  affiliation?: string
  coupon?: string
  discount?: number
  index?: number
  item_brand?: string
  item_category?: string
  item_category2?: string
  item_category3?: string
  item_category4?: string
  item_category5?: string
  item_list_id?: string
  item_list_name?: string
  item_variant?: string
  location_id?: string
  price: number
  quantity: number
}

interface EcommerceBaseEvent extends BaseDataLayerEvent {
  ecommerce: {
    currency?: string
    value?: number
    items: EcommerceItem[]
  }
}

interface ViewItemListEvent extends EcommerceBaseEvent {
  event: 'view_item_list'
  ecommerce: { item_list_id: string; item_list_name: string; items: EcommerceItem[] }
}

interface SelectItemEvent extends EcommerceBaseEvent {
  event: 'select_item'
}

interface ViewItemEvent extends EcommerceBaseEvent {
  event: 'view_item'
  ecommerce: { currency: string; value: number; items: EcommerceItem[] }
}

interface AddToCartEvent extends EcommerceBaseEvent {
  event: 'add_to_cart'
  ecommerce: { currency: string; value: number; items: EcommerceItem[] }
}

interface RemoveFromCartEvent extends EcommerceBaseEvent {
  event: 'remove_from_cart'
  ecommerce: { currency: string; value: number; items: EcommerceItem[] }
}

interface BeginCheckoutEvent extends EcommerceBaseEvent {
  event: 'begin_checkout'
  ecommerce: { currency: string; value: number; coupon?: string; items: EcommerceItem[] }
}

/**
 * KRYTYCZNE: Wysyłać TYLKO RAZ, po potwierdzeniu płatności z serwera.
 * Zabezpieczenie: sessionStorage guard na transaction_id.
 */
interface PurchaseEvent extends EcommerceBaseEvent {
  event: 'purchase'
  ecommerce: {
    transaction_id: string
    value: number
    tax?: number
    shipping?: number
    currency: string
    coupon?: string
    items: EcommerceItem[]
  }
}

interface RefundEvent extends EcommerceBaseEvent {
  event: 'refund'
  ecommerce: {
    transaction_id: string
    value: number
    currency: string
    items?: EcommerceItem[]
  }
}

// === Promocje ===

interface PromotionEvent extends BaseDataLayerEvent {
  event: 'view_promotion' | 'select_promotion'
  ecommerce: {
    creative_name: string
    creative_slot: string
    promotion_id: string
    promotion_name: string
    items?: EcommerceItem[]
  }
}

// === Union type ===

type DataLayerEvent =
  | PhoneClickEvent | PhoneCopyEvent | EmailClickEvent | EmailCopyEvent
  | PageViewTimedEvent | PageViewContactEvent | PageViewCountEvent
  | FormStartEvent | FormSubmitEvent | FormSentEvent | FormErrorEvent
  | ButtonClickEvent | ShowExpanderEvent | SearchEvent
  | ViewItemListEvent | SelectItemEvent | ViewItemEvent
  | AddToCartEvent | RemoveFromCartEvent | BeginCheckoutEvent
  | PurchaseEvent | RefundEvent | PromotionEvent

export type {
  DataLayerEvent, BaseDataLayerEvent, SectionEvent, EcommerceItem,
  PhoneClickEvent, PhoneCopyEvent, EmailClickEvent, EmailCopyEvent,
  PageViewTimedEvent, PageViewContactEvent, PageViewCountEvent,
  FormStartEvent, FormSubmitEvent, FormSentEvent, FormErrorEvent,
  ButtonClickEvent, ShowExpanderEvent, SearchEvent,
  ViewItemListEvent, SelectItemEvent, ViewItemEvent,
  AddToCartEvent, RemoveFromCartEvent, BeginCheckoutEvent,
  PurchaseEvent, RefundEvent, PromotionEvent,
  EcommerceBaseEvent,
}
```

---

## 3. Anonimizacja — `src/core/datalayer/anonymize.ts`

```typescript
/**
 * Anonimizacja numeru telefonu.
 * '+48 711 222 333' → '+48711xxxxx33'
 */
export function anonymizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 9) return phone
  const hasCountryCode = digits.length > 9
  const countryPrefix = hasCountryCode ? '+' + digits.slice(0, digits.length - 9) : ''
  const localDigits = digits.slice(-9)
  return countryPrefix + localDigits.slice(0, 3) + 'x'.repeat(localDigits.length - 5) + localDigits.slice(-2)
}

/**
 * Anonimizacja email.
 * 'biuro@firma.pl' → 'biuro'
 */
export function anonymizeEmail(email: string): string {
  return email.split('@')[0]
}
```

---

## 4. Hooki React

### 4.1 useContactTracking

```typescript
// Parametry: phone_number (zanonimizowany), section, email (przed @)

trackPhoneClick(phone: string, section: string): void
  → pushEvent({ event: 'phone_click', phone_number: anonymizePhone(phone), section })

trackPhoneCopy(phone: string, section: string): void
  → pushEvent({ event: 'phone_copy', phone_number: anonymizePhone(phone), section })

trackEmailClick(email: string, section: string): void
  → pushEvent({ event: 'email_click', email: anonymizeEmail(email), section })

trackEmailCopy(email: string, section: string): void
  → pushEvent({ event: 'email_copy', email: anonymizeEmail(email), section })
```

### 4.2 useEngagement

```typescript
// Auto-mount: timery 1s/2s/30s/120s z cookie guard (1 rok)
// Ręczne: trackContactPageView(), trackPageCount()

useEffect → setTimeout → if (!hasCookie('pv_1s'))  → push({ event: 'page_view_1s' })
useEffect → setTimeout → if (!hasCookie('pv_2s'))  → push({ event: 'page_view_2s' })
useEffect → setTimeout → if (!hasCookie('pv_30s')) → push({ event: 'page_view_30s' })
useEffect → setTimeout → if (!hasCookie('pv_120s'))→ push({ event: 'page_view_120s' })

trackContactPageView()  → if (!hasCookie('pv_contact')) → push({ event: 'page_view_contact' })
trackPageCount()        → sessionStorage counter ≥ 5 → push({ event: 'page_view_count_5' })
```

### 4.3 useFormTracking(formName, section)

```typescript
// Lejek: form_start → form_submit → form_sent_* | form_error

trackStart()     → push({ event: 'form_start', form_name, section })  // raz per formularz
trackSubmit()    → push({ event: 'form_submit', form_name, section })
trackSent(suffix)→ push({ event: `form_sent_${suffix}`, form_name, section })  // TYLKO po HTTP 200
trackError(errorType, errorField) → push({ event: 'form_error', form_name, section, error_type, error_field })
```

### 4.4 useEcommerce

```typescript
// KRYTYCZNE: clearEcommerce() → push({ ecommerce: null }) PRZED każdym push

trackViewItemList(listId, listName, items)  → push({ event: 'view_item_list', ecommerce: {...} })
trackSelectItem(items, listId?, listName?)  → push({ event: 'select_item', ecommerce: {...} })
trackViewItem(currency, value, items)       → push({ event: 'view_item', ecommerce: {...} })
trackAddToCart(currency, value, items)       → push({ event: 'add_to_cart', ecommerce: {...} })
trackRemoveFromCart(currency, value, items)  → push({ event: 'remove_from_cart', ecommerce: {...} })
trackBeginCheckout(currency, value, items, coupon?) → push({ event: 'begin_checkout', ecommerce: {...} })
trackPurchase({transactionId, value, currency, ...}) → sessionStorage guard → push({ event: 'purchase', ecommerce: {...} })
trackRefund(transactionId, value, currency, items?)  → push({ event: 'refund', ecommerce: {...} })
```

### 4.5 usePromoTracking

```typescript
trackViewPromotion({creativeName, creativeSlot, promotionId, promotionName, items?})
  → clearEcommerce() → push({ event: 'view_promotion', ecommerce: {...} })

trackSelectPromotion({...same...})
  → clearEcommerce() → push({ event: 'select_promotion', ecommerce: {...} })
```

---

## 5. GTM Script — kolejność ładowania

```
<head>
  <script> [consent.ts → generateConsentScript(regions)] </script>  ← KROK 1: consent defaults
  <script> GTM snippet z gtmId z DB </script>                       ← KROK 2: GTM (ładuje CMP jako tag)
</head>
<body>
  <noscript> GTM fallback iframe </noscript>                         ← KROK 3: noscript
  ...
</body>
```

---

## 6. Zmienne dataLayer w GTM

| Zmienna GTM | Ścieżka w dataLayer | Zastosowanie |
|---|---|---|
| `DL_phone_number` | `phone_number` | Zanonimizowany numer telefonu |
| `DL_email` | `email` | Zanonimizowana część lokalna emaila |
| `DL_section` | `section` | Sekcja strony |
| `DL_form_name` | `form_name` | Nazwa formularza lub przycisku |
| `DL_error_type` | `error_type` | Komunikat błędu walidacji |
| `DL_error_field` | `error_field` | Nazwa pola z błędem |
| `DL_ecommerce.value` | `ecommerce.value` | Wartość transakcji |
| `DL_ecommerce.items` | `ecommerce.items` | Tablica produktów |
| `DL_search_term` | `search_term` | Fraza wyszukiwania |

---

## 7. Lista kontrolna wdrożenia

| # | Wymaganie | Jak sprawdzić |
|---|---|---|
| 1 | Consent defaults PRZED GTM w `<head>` | Sprawdź layout.tsx — kolejność skryptów |
| 2 | GTM snippet po consent defaults | Sprawdź GTMHead component |
| 3 | noscript GTM po otwarciu `<body>` | Sprawdź GTMNoScript w layout |
| 4 | **Wszystkie eventy w snake_case** | `grep -rE 'event: .*(Click\|Copy\|Start\|Submit\|Sent\|Error\|View)' src/` → ZERO wyników |
| 5 | **Wszystkie parametry w snake_case** | `grep -rE 'PhoneNumber\|Section\|Error_Type\|Error_Field' src/` → ZERO wyników (poza tym dokumentem) |
| 6 | phone_number zanonimizowany | Unit test: `anonymizePhone('+48711222333')` → `'+48711xxxxx33'` |
| 7 | email zanonimizowany | Unit test: `anonymizeEmail('biuro@firma.pl')` → `'biuro'` |
| 8 | page_view_* z logiką cookies | Sprawdź useEngagement — hasCookie() przed każdym push |
| 9 | form_sent_* TYLKO po HTTP 200 | Sprawdź TrackedForm — push w bloku if (result.success) |
| 10 | E-commerce: `{ ecommerce: null }` przed każdym push | Sprawdź useEcommerce — clearEcommerce() |
| 11 | currency przy eventach z value | TypeScript enforces required field |
| 12 | transaction_id w purchase unikalny | Sprawdź trackPurchase — sessionStorage guard |
| 13 | purchase wysyłany raz | j.w. |
| 14 | Brak `[NAWIASÓW]` w kodzie | `grep '\[.*\]' src/**/*.ts` → ZERO |
| 15 | GTM ID z DB (site_config), nie hardcoded | Sprawdź siteConfigService.get('analytics.gtmId') |

---

## 8. Pełna referencja zdarzeń

| Kategoria | Zdarzenie (event) | Hook Cortex | Parametry |
|---|---|---|---|
| Kontakt | `phone_click` | `useContactTracking().trackPhoneClick()` | phone_number, section |
| Kontakt | `phone_copy` | `useContactTracking().trackPhoneCopy()` | phone_number, section |
| Kontakt | `email_click` | `useContactTracking().trackEmailClick()` | email, section |
| Kontakt | `email_copy` | `useContactTracking().trackEmailCopy()` | email, section |
| Engagement | `page_view_1s` | `useEngagement()` (auto) | — |
| Engagement | `page_view_2s` | `useEngagement()` (auto) | — |
| Engagement | `page_view_30s` | `useEngagement()` (auto) | — |
| Engagement | `page_view_120s` | `useEngagement()` (auto) | — |
| Engagement | `page_view_contact` | `useEngagement().trackContactPageView()` | — |
| Engagement | `page_view_count_5` | `useEngagement().trackPageCount()` | — |
| Formularze | `form_start` | `useFormTracking().trackStart()` | form_name, section |
| Formularze | `form_submit` | `useFormTracking().trackSubmit()` | form_name, section |
| Formularze | `form_sent_*` | `useFormTracking().trackSent()` | form_name, section |
| Formularze | `form_error` | `useFormTracking().trackError()` | form_name, section, error_type, error_field |
| UI | `button_click` | `useButtonTracking().trackButtonClick()` | form_name, section |
| UI | `show_expander` | `useButtonTracking().trackExpander()` | form_name, section |
| UI | `search` | `useSearchTracking().trackSearch()` | search_term |
| E-commerce | `view_item_list` | `useEcommerce().trackViewItemList()` | items, item_list_id, item_list_name |
| E-commerce | `select_item` | `useEcommerce().trackSelectItem()` | items |
| E-commerce | `view_item` | `useEcommerce().trackViewItem()` | currency, value, items |
| E-commerce | `add_to_cart` | `useEcommerce().trackAddToCart()` | currency, value, items |
| E-commerce | `remove_from_cart` | `useEcommerce().trackRemoveFromCart()` | currency, value, items |
| E-commerce | `begin_checkout` | `useEcommerce().trackBeginCheckout()` | currency, value, items |
| E-commerce | `purchase` | `useEcommerce().trackPurchase()` | transaction_id, value, currency, items |
| E-commerce | `refund` | `useEcommerce().trackRefund()` | transaction_id, value, currency |
| Promocje | `view_promotion` | `usePromoTracking().trackViewPromotion()` | creative_name, creative_slot, promotion_id |
| Promocje | `select_promotion` | `usePromoTracking().trackSelectPromotion()` | creative_name, creative_slot, promotion_id |

---

*Dokument wygenerowany na podstawie: Specyfikacja Warstwy Danych 7p.marketing OÜ v1.0*
*Przerobiony na Cortex Framework — snake_case, TypeScript, React hooks, tracked components.*
