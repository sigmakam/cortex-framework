/**
 * DataLayer push validators — runtime checks before pushing to dataLayer.
 *
 * Used in development/debug mode to catch common mistakes early.
 */

import type { DataLayerEvent, EcommerceItem } from "./types";

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validates a dataLayer event object before push.
 * Returns array of errors (empty if valid).
 */
export function validateDataLayerEvent(
  event: Record<string, unknown>,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Allow ecommerce clearing pushes
  if ("ecommerce" in event && event.ecommerce === null) {
    return errors;
  }

  // Must have event field
  if (!event.event || typeof event.event !== "string") {
    errors.push({
      field: "event",
      message: "Missing or invalid 'event' field (must be a non-empty string)",
    });
    return errors; // can't validate further without event name
  }

  const eventName = event.event as string;

  // snake_case check — no uppercase letters allowed in event names
  if (/[A-Z]/.test(eventName)) {
    errors.push({
      field: "event",
      message: `Event name '${eventName}' contains uppercase letters. Use snake_case.`,
    });
  }

  // Contact events — must have phone_number or email + section
  if (["phone_click", "phone_copy"].includes(eventName)) {
    if (!event.phone_number || typeof event.phone_number !== "string") {
      errors.push({ field: "phone_number", message: "Required for phone events" });
    }
    if (!event.section) {
      errors.push({ field: "section", message: "Required for contact events" });
    }
  }

  if (["email_click", "email_copy"].includes(eventName)) {
    if (!event.email || typeof event.email !== "string") {
      errors.push({ field: "email", message: "Required for email events" });
    }
    if (typeof event.email === "string" && event.email.includes("@")) {
      errors.push({
        field: "email",
        message: "Email must be anonymized (only local part before @)",
      });
    }
    if (!event.section) {
      errors.push({ field: "section", message: "Required for contact events" });
    }
  }

  // Form events — must have form_name + section
  if (eventName.startsWith("form_")) {
    if (!event.form_name) {
      errors.push({ field: "form_name", message: "Required for form events" });
    }
    if (!event.section) {
      errors.push({ field: "section", message: "Required for form events" });
    }
  }

  // form_error — must have error_type + error_field
  if (eventName === "form_error") {
    if (!event.error_type) {
      errors.push({ field: "error_type", message: "Required for form_error" });
    }
    if (!event.error_field) {
      errors.push({ field: "error_field", message: "Required for form_error" });
    }
  }

  // E-commerce events — validate ecommerce object
  const ecommerceEvents = [
    "view_item_list", "select_item", "view_item",
    "add_to_cart", "remove_from_cart", "begin_checkout",
    "purchase", "refund", "view_promotion", "select_promotion",
  ];

  if (ecommerceEvents.includes(eventName)) {
    const ecommerce = event.ecommerce as Record<string, unknown> | undefined;
    if (!ecommerce || typeof ecommerce !== "object") {
      errors.push({
        field: "ecommerce",
        message: "Required object for e-commerce events",
      });
    } else {
      // Events with value must have currency
      if ("value" in ecommerce && !ecommerce.currency) {
        errors.push({
          field: "ecommerce.currency",
          message: "Required when ecommerce.value is present",
        });
      }

      // purchase must have transaction_id
      if (eventName === "purchase" && !ecommerce.transaction_id) {
        errors.push({
          field: "ecommerce.transaction_id",
          message: "Required for purchase event",
        });
      }

      // Items validation
      if ("items" in ecommerce) {
        const items = ecommerce.items as EcommerceItem[];
        if (Array.isArray(items)) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.item_id && !item.item_name) {
              errors.push({
                field: `ecommerce.items[${i}]`,
                message: "item_id or item_name is required",
              });
            }
          }
        }
      }
    }
  }

  return errors;
}
