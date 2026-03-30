"use client";

import { useDataLayer } from "@/components/DataLayerProvider";
import type { EcommerceItem } from "@/core/datalayer/types";

interface PromotionParams {
  creativeName: string;
  creativeSlot: string;
  promotionId: string;
  promotionName: string;
  items?: EcommerceItem[];
}

/**
 * Hook for tracking promotion interactions (banner views and clicks).
 */
export function usePromoTracking() {
  const { pushEvent } = useDataLayer();

  function clearEcommerce(): void {
    pushEvent({ ecommerce: null });
  }

  return {
    /** Promotion banner/content displayed to user */
    trackViewPromotion(params: PromotionParams): void {
      clearEcommerce();
      pushEvent({
        event: "view_promotion",
        ecommerce: {
          creative_name: params.creativeName,
          creative_slot: params.creativeSlot,
          promotion_id: params.promotionId,
          promotion_name: params.promotionName,
          items: params.items,
        },
      });
    },

    /** User clicked on a promotion */
    trackSelectPromotion(params: PromotionParams): void {
      clearEcommerce();
      pushEvent({
        event: "select_promotion",
        ecommerce: {
          creative_name: params.creativeName,
          creative_slot: params.creativeSlot,
          promotion_id: params.promotionId,
          promotion_name: params.promotionName,
          items: params.items,
        },
      });
    },
  };
}
