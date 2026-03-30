/**
 * DataLayer event types — snake_case convention throughout.
 * Aligned with GA4 recommended events naming.
 */

// === Base ===

export interface BaseDataLayerEvent {
  event: string;
}

export interface SectionEvent extends BaseDataLayerEvent {
  section: string;
}

// === Contact interactions ===

export interface PhoneClickEvent extends SectionEvent {
  event: "phone_click";
  phone_number: string;
}

export interface PhoneCopyEvent extends SectionEvent {
  event: "phone_copy";
  phone_number: string;
}

export interface EmailClickEvent extends SectionEvent {
  event: "email_click";
  email: string;
}

export interface EmailCopyEvent extends SectionEvent {
  event: "email_copy";
  email: string;
}

// === Engagement (page view timed) ===

export interface PageViewTimedEvent extends BaseDataLayerEvent {
  event: "page_view_1s" | "page_view_2s" | "page_view_30s" | "page_view_120s";
}

export interface PageViewContactEvent extends BaseDataLayerEvent {
  event: "page_view_contact";
}

export interface PageViewCountEvent extends BaseDataLayerEvent {
  event: "page_view_count_5";
}

// === Forms ===

export interface FormStartEvent extends SectionEvent {
  event: "form_start";
  form_name: string;
}

export interface FormSubmitEvent extends SectionEvent {
  event: "form_submit";
  form_name: string;
}

export interface FormSentEvent extends SectionEvent {
  event: `form_sent_${string}`;
  form_name: string;
}

export interface FormErrorEvent extends SectionEvent {
  event: "form_error";
  form_name: string;
  error_type: string;
  error_field: string;
}

// === UI ===

export interface ButtonClickEvent extends SectionEvent {
  event: "button_click";
  form_name: string;
}

export interface ShowExpanderEvent extends SectionEvent {
  event: "show_expander";
  form_name: string;
}

export interface SearchEvent extends BaseDataLayerEvent {
  event: "search";
  search_term: string;
}

// === E-commerce (GA4 standard) ===

export interface EcommerceItem {
  item_id: string;
  item_name: string;
  affiliation?: string;
  coupon?: string;
  discount?: number;
  index?: number;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_category4?: string;
  item_category5?: string;
  item_list_id?: string;
  item_list_name?: string;
  item_variant?: string;
  location_id?: string;
  price: number;
  quantity: number;
}

export interface EcommerceBaseEvent extends BaseDataLayerEvent {
  ecommerce: {
    currency?: string;
    value?: number;
    items: EcommerceItem[];
  };
}

export interface ViewItemListEvent extends EcommerceBaseEvent {
  event: "view_item_list";
  ecommerce: {
    item_list_id: string;
    item_list_name: string;
    items: EcommerceItem[];
  };
}

export interface SelectItemEvent extends EcommerceBaseEvent {
  event: "select_item";
}

export interface ViewItemEvent extends EcommerceBaseEvent {
  event: "view_item";
  ecommerce: { currency: string; value: number; items: EcommerceItem[] };
}

export interface AddToCartEvent extends EcommerceBaseEvent {
  event: "add_to_cart";
  ecommerce: { currency: string; value: number; items: EcommerceItem[] };
}

export interface RemoveFromCartEvent extends EcommerceBaseEvent {
  event: "remove_from_cart";
  ecommerce: { currency: string; value: number; items: EcommerceItem[] };
}

export interface BeginCheckoutEvent extends EcommerceBaseEvent {
  event: "begin_checkout";
  ecommerce: {
    currency: string;
    value: number;
    coupon?: string;
    items: EcommerceItem[];
  };
}

export interface PurchaseEvent extends EcommerceBaseEvent {
  event: "purchase";
  ecommerce: {
    transaction_id: string;
    value: number;
    tax?: number;
    shipping?: number;
    currency: string;
    coupon?: string;
    items: EcommerceItem[];
  };
}

export interface RefundEvent extends EcommerceBaseEvent {
  event: "refund";
  ecommerce: {
    transaction_id: string;
    value: number;
    currency: string;
    items?: EcommerceItem[];
  };
}

// === Promotions ===

export interface PromotionEvent extends BaseDataLayerEvent {
  event: "view_promotion" | "select_promotion";
  ecommerce: {
    creative_name: string;
    creative_slot: string;
    promotion_id: string;
    promotion_name: string;
    items?: EcommerceItem[];
  };
}

// === Union ===

export type DataLayerEvent =
  | PhoneClickEvent
  | PhoneCopyEvent
  | EmailClickEvent
  | EmailCopyEvent
  | PageViewTimedEvent
  | PageViewContactEvent
  | PageViewCountEvent
  | FormStartEvent
  | FormSubmitEvent
  | FormSentEvent
  | FormErrorEvent
  | ButtonClickEvent
  | ShowExpanderEvent
  | SearchEvent
  | ViewItemListEvent
  | SelectItemEvent
  | ViewItemEvent
  | AddToCartEvent
  | RemoveFromCartEvent
  | BeginCheckoutEvent
  | PurchaseEvent
  | RefundEvent
  | PromotionEvent;
