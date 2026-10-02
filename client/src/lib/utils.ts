export {
  cn,
  formatPrice,
  formatOrderId,
  getStatusColor,
  getStatusLabel,
} from "@/utils"

/**
 * Calculates the great-circle distance between two coordinates in kilometers using the Haversine formula.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calculates delivery fee based on distance:
 * - Base ₹40 for up to 3km
 * - ₹10 per km beyond 3km
 * - Maximum cap of ₹100
 */
export function calculateDeliveryFee(distanceKm?: string | number | null): number {
  if (distanceKm === null || distanceKm === undefined) return 40
  const dist = typeof distanceKm === "string" ? parseFloat(distanceKm) : distanceKm
  if (isNaN(dist) || dist <= 3) return 40
  return Math.min(100, Math.round(40 + (dist - 3) * 10))
}

export interface AddressValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validates that an address is a genuine delivery address:
 * - Minimum 15 characters
 * - No words longer than 15 characters without spaces (blocks keyboard mash)
 * - Contains real words with vowels (rejects words lacking vowels)
 * - Contains alphabetic characters (minimum 5 letters)
 * - Contains at least 2 distinct words
 * - Rejects repetitive character spam (like 'aaaaaaa' or '111111')
 * - Rejects repetitive pattern spam (like 'asdfasdfasdf')
 * - Rejects keyboard walks (like 'qwerty', 'asdfgh')
 * - Enforces retention of map-synced reverse-geocoded area/city details (or core keyword 'Nagpur')
 */
export function validateDeliveryAddress(
  rawAddress: string,
  geocodedBaseAddress?: string | null
): AddressValidationResult {
  if (!rawAddress || !rawAddress.trim()) {
    if (geocodedBaseAddress) {
      return { isValid: false, error: "Please retain the map-synced area details." }
    }
    return { isValid: false, error: "Please enter your delivery address." }
  }

  const trimmed = rawAddress.trim()
  const normalizedRaw = trimmed.toLowerCase()

  // 1. Enforce retention of geocoded base address (if available)
  if (geocodedBaseAddress && geocodedBaseAddress.trim().length > 0) {
    const normalizedBase = geocodedBaseAddress.trim().toLowerCase()
    // Directly accept full formatted_address or if rawAddress contains it
    if (!normalizedRaw.includes(normalizedBase)) {
      const baseTokens = normalizedBase
        .split(/[\s,./\-\\]+/)
        .filter((t) => t.length > 2 && !["the", "near", "opposite", "opp"].includes(t))
      const matchCount = baseTokens.filter((t) => normalizedRaw.includes(t)).length
      const threshold = Math.min(2, baseTokens.length)
      if (matchCount < threshold && !normalizedRaw.includes("nagpur")) {
        return {
          isValid: false,
          error: "Please retain the map-synced area details.",
        }
      }
    }
  } else {
    // If no geocoded base address is provided, ensure local delivery city keyword (Nagpur) is present
    if (!normalizedRaw.includes("nagpur")) {
      return {
        isValid: false,
        error: "Address must include the delivery city/area (Nagpur).",
      }
    }
  }

  // 2. Minimum character length (minimum 15 characters)
  if (trimmed.length < 15) {
    return {
      isValid: false,
      error: `Address is too short (${trimmed.length}/15 chars). Please enter a complete address.`,
    }
  }

  // 3. Reject words longer than 15 characters without spaces (common keyboard mash / spam)
  if (/\S{16,}/.test(trimmed)) {
    return {
      isValid: false,
      error: "Address contains invalid words longer than 15 characters without spaces.",
    }
  }

  // 4. Must contain letters (not just numbers or symbols)
  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, "")
  if (lettersOnly.length < 5) {
    return {
      isValid: false,
      error: "Please enter a valid street or locality name with letters.",
    }
  }

  // 5. Must contain multiple words (at least 2 words, e.g. Flat/House and Area/Street)
  const words = trimmed
    .split(/[\s,./\-\\]+/)
    .filter((w) => w.length > 0)

  if (words.length < 2) {
    return {
      isValid: false,
      error: "Please include complete details like building, street and area (at least 2 words).",
    }
  }

  // 6. Fail validation if any single word lacks vowels completely (e.g. "sdfghjkl", "bcdfghjk")
  // Allows single letter identifiers (e.g. "Wing B", "Plot C"), common abbreviations ("St", "Rd", "Bldg"),
  // Google Plus Codes (e.g. "538G+7HX"), and alphanumeric codes (e.g. "T45", "B-4", "Flat 302")
  const commonNoVowelAbbrs = new Set(["st", "rd", "dr", "nr", "pl", "bldg", "blk", "flr", "gf", "ff", "sf", "tf", "ph"])
  const hasNoVowelWord = words.some((word) => {
    // Bypass Google Plus Codes (e.g. "538G+7HX" or tokens matching Plus Code pattern)
    if (/[A-Z0-9]{4,}\+[A-Z0-9]{2,}/i.test(word) || (word.includes("+") && /[A-Z0-9]/i.test(word))) {
      return false
    }

    // Bypass alphanumeric codes and numbers (e.g. unit/block numbers like "B-4", "T45", "Flat 302")
    if (/\d/.test(word)) {
      return false
    }

    const letters = word.replace(/[^a-zA-Z]/g, "")
    if (letters.length <= 1) return false
    if (commonNoVowelAbbrs.has(letters.toLowerCase())) return false
    return !/[aeiouy]/i.test(letters)
  })
  if (hasNoVowelWord) {
    return {
      isValid: false,
      error: "Address contains gibberish words lacking vowels. Please enter a valid address.",
    }
  }

  // 7. Check for repetitive character spam (e.g. "aaaaa", "11111")
  if (/(.)\1{4,}/i.test(trimmed)) {
    return {
      isValid: false,
      error: "Address contains invalid repetitive characters.",
    }
  }

  // 8. Check for repeated word/pattern spam (e.g. "asdfasdfasdf")
  if (/(.{3,})\1{2,}/i.test(trimmed.replace(/\s+/g, ""))) {
    return {
      isValid: false,
      error: "Address contains invalid repetitive patterns.",
    }
  }

  // 9. Check for pure consonant mash (6+ consecutive consonants across word parts)
  const hasConsonantMash = words.some((word) => {
    if (/[A-Z0-9]{4,}\+[A-Z0-9]{2,}/i.test(word) || (word.includes("+") && /[A-Z0-9]/i.test(word)) || /\d/.test(word)) {
      return false
    }
    const letters = word.replace(/[^a-zA-Z]/g, "")
    return letters.length >= 6 && !/[aeiouy]/i.test(letters)
  })
  if (hasConsonantMash) {
    return {
      isValid: false,
      error: "Address appears to be invalid or gibberish. Please provide a real address.",
    }
  }

  // 10. Check for obvious keyboard walk patterns
  const keyboardWalks = /(asdfgh|qwerty|zxcvbn|123456|qwertz|azerty)/i
  if (keyboardWalks.test(trimmed.toLowerCase())) {
    return {
      isValid: false,
      error: "Please enter a genuine delivery address, not a dummy keyboard pattern.",
    }
  }

  return { isValid: true }
}

export interface NominatimAddressDetails {
  amenity?: string
  building?: string
  house_number?: string
  road?: string
  pedestrian?: string
  residential?: string
  neighbourhood?: string
  suburb?: string
  city?: string
  town?: string
  village?: string
  postcode?: string
  [key: string]: any
}

/**
 * Formats a localized, granular address from geocoding results without truncating.
 */
export function formatGranularAddress(addrObj: NominatimAddressDetails | string | undefined): string {
  if (!addrObj) return ""

  // If already a full formatted address string, return directly without truncating
  if (typeof addrObj === "string") {
    return addrObj.replace(/,\s*India$/i, "").trim()
  }

  if (addrObj.display_name && typeof addrObj.display_name === "string") {
    return addrObj.display_name.replace(/,\s*India$/i, "").trim()
  }

  if (addrObj.formatted_address && typeof addrObj.formatted_address === "string") {
    return addrObj.formatted_address.replace(/,\s*India$/i, "").trim()
  }

  const parts: (string | undefined)[] = [
    addrObj.amenity,
    addrObj.building,
    addrObj.house_number,
    addrObj.road || addrObj.pedestrian || addrObj.residential,
    addrObj.neighbourhood,
    addrObj.suburb,
    addrObj.city || addrObj.town || addrObj.village,
    addrObj.postcode,
  ]

  // Filter out undefined, empty, and duplicate components
  const uniqueParts: string[] = []
  for (const part of parts) {
    if (part && typeof part === "string") {
      const clean = part.trim()
      if (clean && !uniqueParts.some((p) => p.toLowerCase() === clean.toLowerCase())) {
        uniqueParts.push(clean)
      }
    }
  }

  return uniqueParts.join(", ")
}

export interface PhoneValidationResult {
  isValid: boolean
  error?: string
  cleanedNumber?: string
}

/**
 * Validates a standard 10-digit Indian mobile number:
 * - Must start with 6, 7, 8, or 9
 * - Must be exactly 10 digits
 * - Strips common prefixes (+91, 0) and formatting spaces/hyphens
 */
export function validatePhoneNumber(rawPhone: string): PhoneValidationResult {
  if (!rawPhone || !rawPhone.trim()) {
    return { isValid: false, error: "Please enter your 10-digit mobile number." }
  }

  const cleaned = rawPhone.trim().replace(/[\s\-()]/g, "").replace(/^(\+91|0)/, "")

  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, error: "Mobile number must contain digits only." }
  }

  if (cleaned.length < 10) {
    return { isValid: false, error: `Mobile number is too short (${cleaned.length}/10 digits).` }
  }

  if (cleaned.length > 10) {
    return { isValid: false, error: `Mobile number must be 10 digits (${cleaned.length} entered).` }
  }

  if (!/^[6-9]/.test(cleaned)) {
    return { isValid: false, error: "Indian mobile numbers must start with 6, 7, 8, or 9." }
  }

  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return { isValid: false, error: "Please enter a valid 10-digit Indian mobile number." }
  }

  return { isValid: true, cleanedNumber: cleaned }
}


