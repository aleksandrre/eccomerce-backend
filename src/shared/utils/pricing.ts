/**
 * Single source of truth for unit-price computation. Prices are always derived
 * live from the current product document — never trusted from the client or a
 * frozen snapshot.
 *
 * FUTURE (checkout): the checkout/payment module MUST recompute the final line
 * and order totals here, server-side, at the moment payment is initiated.
 */

export interface FoodPricingFields {
  pricePerKg: number;
  bulkPricePerKg: number;
  kgThreshold: number;
}

export interface AnimalPricingFields {
  price: number;
  sale: number;
}

/**
 * Food is sold by weight with a two-tier price:
 *   quantity <  kgThreshold → pricePerKg      (normal)
 *   quantity >= kgThreshold → bulkPricePerKg  (bulk / lower)
 */
export function computeFoodUnitPrice(
  product: FoodPricingFields,
  quantity: number
): number {
  const unit =
    quantity >= product.kgThreshold
      ? product.bulkPricePerKg
      : product.pricePerKg;
  return Number(unit.toFixed(2));
}

/**
 * Animal food is sold in packages with a percentage discount:
 *   discountedPrice = price * (1 - sale / 100)
 */
export function computeAnimalUnitPrice(product: AnimalPricingFields): number {
  return Number((product.price - (product.price * product.sale) / 100).toFixed(2));
}
