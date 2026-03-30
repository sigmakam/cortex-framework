"use client";

import { useDataLayer } from "@/components/DataLayerProvider";
import type { EcommerceItem } from "@/core/datalayer/types";

/**
 * Hook for tracking GA4 e-commerce events.
 *
 * CRITICAL: Before every e-commerce push, previous ecommerce object MUST be cleared:
 *   dataLayer.push({ ecommerce: null })
 * This is handled automatically by clearEcommerce() called inside each method.
 */
export function useEcommerce() {
  const { pushEvent } = useDataLayer();

  function clearEcommerce(): void {
    pushEvent({ ecommerce: null });
  }

  return {
    /** Product list displayed (category page, search results, related products) */
    trackViewItemList(
      listId: string,
      listName: string,
      items: EcommerceItem[],
    ): void {
      clearEcommerce();
      pushEvent({
        event: "view_item_list",
        ecommerce: {
          item_list_id: listId,
          item_list_name: listName,
          items,
        },
      });
    },

    /** User clicked a product from a list */
    trackSelectItem(
      items: EcommerceItem[],
      listId?: string,
      listName?: string,
    ): void {
      clearEcommerce();
      pushEvent({
        event: "select_item",
        ecommerce: {
          item_list_id: listId,
          item_list_name: listName,
          items,
        },
      });
    },

    /** Product detail page viewed */
    trackViewItem(
      currency: string,
      value: number,
      items: EcommerceItem[],
    ): void {
      clearEcommerce();
      pushEvent({
        event: "view_item",
        ecommerce: { currency, value, items },
      });
    },

    /** Item added to cart */
    trackAddToCart(
      currency: string,
      value: number,
      items: EcommerceItem[],
    ): void {
      clearEcommerce();
      pushEvent({
        event: "add_to_cart",
        ecommerce: { currency, value, items },
      });
    },

    /** Item removed from cart */
    trackRemoveFromCart(
      currency: string,
      value: number,
      items: EcommerceItem[],
    ): void {
      clearEcommerce();
      pushEvent({
        event: "remove_from_cart",
        ecommerce: { currency, value, items },
      });
    },

    /** Checkout initiated */
    trackBeginCheckout(
      currency: string,
      value: number,
      items: EcommerceItem[],
      coupon?: string,
    ): void {
      clearEcommerce();
      pushEvent({
        event: "begin_checkout",
        ecommerce: { currency, value, coupon, items },
      });
    },

    /**
     * CRITICAL: Fire ONLY ONCE after payment confirmed by server.
     * NOT on 'Place Order' button click. Duplicates inflate revenue in GA4/GAds.
     * Built-in sessionStorage guard prevents duplicate pushes.
     */
    trackPurchase(params: {
      transactionId: string;
      value: number;
      currency: string;
      tax?: number;
      shipping?: number;
      coupon?: string;
      items: EcommerceItem[];
    }): void {
      if (typeof sessionStorage !== "undefined") {
        const key = `cortex_purchase_${params.transactionId}`;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
      }

      clearEcommerce();
      pushEvent({
        event: "purchase",
        ecommerce: {
          transaction_id: params.transactionId,
          value: params.value,
          tax: params.tax,
          shipping: params.shipping,
          currency: params.currency,
          coupon: params.coupon,
          items: params.items,
        },
      });
    },

    /** Order refunded (full or partial) */
    trackRefund(
      transactionId: string,
      value: number,
      currency: string,
      items?: EcommerceItem[],
    ): void {
      clearEcommerce();
      pushEvent({
        event: "refund",
        ecommerce: {
          transaction_id: transactionId,
          value,
          currency,
          items,
        },
      });
    },
  };
}
