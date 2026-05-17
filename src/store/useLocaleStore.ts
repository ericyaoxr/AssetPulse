import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Currency = "CNY" | "USD" | "EUR" | "GBP" | "JPY" | "HKD" | "TWD"
export type Language = "zh" | "en"

export interface CurrencyConfig {
  symbol: string
  symbolPosition: "before" | "after"
  decimal: string
  thousands: string
  decimalCount: number
  exchangeRate: number // 相对于1 CNY的汇率
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  CNY: {
    symbol: "¥",
    symbolPosition: "before",
    decimal: ".",
    thousands: ",",
    decimalCount: 2,
    exchangeRate: 1,
  },
  USD: {
    symbol: "$",
    symbolPosition: "before",
    decimal: ".",
    thousands: ",",
    decimalCount: 2,
    exchangeRate: 0.14,
  },
  EUR: {
    symbol: "€",
    symbolPosition: "after",
    decimal: ",",
    thousands: ".",
    decimalCount: 2,
    exchangeRate: 0.13,
  },
  GBP: {
    symbol: "£",
    symbolPosition: "before",
    decimal: ".",
    thousands: ",",
    decimalCount: 2,
    exchangeRate: 0.11,
  },
  JPY: {
    symbol: "¥",
    symbolPosition: "before",
    decimal: ".",
    thousands: ",",
    decimalCount: 0,
    exchangeRate: 20.5,
  },
  HKD: {
    symbol: "HK$",
    symbolPosition: "before",
    decimal: ".",
    thousands: ",",
    decimalCount: 2,
    exchangeRate: 1.09,
  },
  TWD: {
    symbol: "NT$",
    symbolPosition: "before",
    decimal: ".",
    thousands: ",",
    decimalCount: 2,
    exchangeRate: 4.4,
  },
}

export const LANGUAGES = {
  zh: "简体中文",
  en: "English",
}

interface LocaleStore {
  currency: Currency
  language: Language
  setCurrency: (currency: Currency) => void
  setLanguage: (language: Language) => void
  updateExchangeRate: (currency: Currency, rate: number) => void
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      currency: "CNY",
      language: "zh",
      setCurrency: (currency) => set({ currency }),
      setLanguage: (language) => set({ language }),
      updateExchangeRate: (currency, rate) => {
        CURRENCIES[currency].exchangeRate = rate
      },
    }),
    {
      name: "assetpulse-locale-storage",
    }
  )
)

// 格式化货币
export function formatCurrency(
  amount: number,
  currency?: Currency
): string {
  const { currency: currentCurrency } = useLocaleStore.getState()
  const targetCurrency = currency || currentCurrency
  const config = CURRENCIES[targetCurrency]
  const baseCurrency = useLocaleStore.getState().currency
  
  // 如果需要转换货币
  let convertedAmount = amount
  if (baseCurrency !== targetCurrency && baseCurrency !== "CNY") {
    // 先转换为 CNY，再转换为目标货币
    const cnyAmount = amount / CURRENCIES[baseCurrency].exchangeRate
    convertedAmount = cnyAmount * CURRENCIES[targetCurrency].exchangeRate
  } else if (baseCurrency !== targetCurrency && targetCurrency !== "CNY") {
    convertedAmount = amount * CURRENCIES[targetCurrency].exchangeRate
  }

  // 格式化数字
  const formattedNumber = formatNumber(convertedAmount, config.decimalCount)
  const [integerPart, decimalPart] = formattedNumber.split(".")
  
  // 添加千位分隔符
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, config.thousands)
  
  // 组合
  let result = decimalPart 
    ? `${formattedInteger}${config.decimal}${decimalPart}` 
    : formattedInteger
  
  // 添加符号
  if (config.symbolPosition === "before") {
    result = `${config.symbol}${result}`
  } else {
    result = `${result}${config.symbol}`
  }
  
  return result
}

function formatNumber(num: number, decimalCount: number): string {
  const power = Math.pow(10, decimalCount)
  const rounded = Math.round(num * power) / power
  return rounded.toFixed(decimalCount)
}

// 转换货币
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): number {
  if (from === to) return amount
  
  const fromConfig = CURRENCIES[from]
  const toConfig = CURRENCIES[to]
  
  // 先转换为 CNY，再转换为目标货币
  const cnyAmount = fromConfig.exchangeRate !== 1 
    ? amount / fromConfig.exchangeRate 
    : amount
  
  return toConfig.exchangeRate !== 1 
    ? cnyAmount * toConfig.exchangeRate 
    : cnyAmount
}
