// useBuySellModal stores the state of the BuySellModal so that one instance of it can be used throughout the app.

import React, { useCallback, useContext, useState } from 'react'
import { BuySellAction } from '../components/BuySellModal'

export interface CurrencyOption {
  value: string
  label: string
}

const DEFAULT_CURRENCY_OPTION = {
  value: 'bitcoin',
  label: 'Bitcoin',
} as CurrencyOption

export const useBuySellModal = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [action, setAction] = useState<BuySellAction>(BuySellAction.Buy)
  const [currency, setCurrency] = useState<CurrencyOption>(DEFAULT_CURRENCY_OPTION)

  const openBuyModal = useCallback((currency: CurrencyOption) => {
    setCurrency(currency)
    setAction(BuySellAction.Buy)
    setIsOpen(true)
  }, [])

  const openSellModal = useCallback((currency: CurrencyOption) => {
    setCurrency(currency)
    setAction(BuySellAction.Sell)
    setIsOpen(true)
  }, [])

  const hideModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    hideModal,
    action,
    currency,
    setCurrency,
    openBuyModal,
    openSellModal,
  }
}

export const BuySellModalContext = React.createContext<ReturnType<typeof useBuySellModal>>({
  isOpen: false,
  hideModal: () => void undefined,
  action: BuySellAction.Buy,
  currency: DEFAULT_CURRENCY_OPTION,
  setCurrency: () => void undefined,
  openBuyModal: () => void undefined,
  openSellModal: () => void undefined,
})

export const useBuySellModalContext = () => useContext(BuySellModalContext)
