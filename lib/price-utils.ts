export interface ComputePriceParams {
  basePrice: number
  originalPrice?: number | null
  salePrice?: number | null
  taxApplied?: boolean
  taxRate?: number
  taxIncluded?: boolean
}

export interface ComputePriceResult {
  displayPrice: number
  displayOriginalPrice: number
  discountPercent: number
  _preTaxBase: number
  _preTaxSale: number | null
  canonicalPreTaxSale: number | null
  canonicalPreTaxPrice: number
}

export const computePrice = ({
  basePrice,
  originalPrice,
  salePrice,
  taxRate = 0,
}: ComputePriceParams): ComputePriceResult => {
  const rate = taxRate / 100
  const effectiveOriginal = originalPrice ?? basePrice
  const effectiveSale = (salePrice !== null && salePrice !== undefined) ? salePrice : basePrice

  // All products include tax, so display price is the stored price
  const displayPrice = effectiveSale
  const displayOriginalPrice = effectiveOriginal

  // Calculate pre-tax values (back-calculate from inclusive price)
  // If rate is 0, preTax is same as display
  const preTaxBase = basePrice / (1 + rate)
  const preTaxSale = (salePrice !== null && salePrice !== undefined) 
    ? salePrice / (1 + rate) 
    : null

  // Calculate discount percent based on display prices
  let discountPercent = 0
  if (displayOriginalPrice > displayPrice) {
    discountPercent = Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
  }

  return {
    displayPrice: Math.round(displayPrice),
    displayOriginalPrice: Math.round(displayOriginalPrice),
    discountPercent,
    _preTaxBase: preTaxBase,
    _preTaxSale: preTaxSale,
    canonicalPreTaxSale: preTaxSale !== null ? Math.round(preTaxSale) : null,
    canonicalPreTaxPrice: Math.round(preTaxBase),
  }
}
