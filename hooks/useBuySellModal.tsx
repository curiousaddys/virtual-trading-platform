// useBuySellModal stores the state of the BuySellModal so that one instance of it can be used throughout the app.

import React, { useCallback, useContext, useState } from 'react'
import { BuySellAction, SelectedOption } from '../components/BuySellModal'
import { useBool } from './useBool'

const DEFAULT_CURRENCY_VALUE = {
  value: 'bitcoin',
  label: 'Bitcoin',
} as SelectedOption

export const useBuySellModal = () => {
  const [isOpen, showModal, hideModal] = useBool(false)
  const [action, setAction] = useState<BuySellAction>(BuySellAction.Buy)
  const [currency, setCurrency] = useState<SelectedOption>(DEFAULT_CURRENCY_VALUE)

  const openBuyModal = useCallback(
    (currency: SelectedOption) => {
      setCurrency(currency)
      setAction(BuySellAction.Buy)
      showModal()
    },
    [showModal]
  )

  const openSellModal = useCallback(
    (currency: SelectedOption) => {
      setCurrency(currency)
      setAction(BuySellAction.Sell)
      showModal()
    },
    [showModal]
  )

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

export const BuySellModalContext = React.createContext<{
  isOpen: boolean
  hideModal: () => void
  action: string
  currency: SelectedOption
  setCurrency: (currency: SelectedOption) => void
  openBuyModal: (currency: SelectedOption) => void
  openSellModal: (currency: SelectedOption) => void
}>({
  isOpen: false,
  hideModal: () => {},
  action: '',
  currency: DEFAULT_CURRENCY_VALUE,
  setCurrency: (currency) => {},
  openBuyModal: (currency) => {},
  openSellModal: (currency) => {},
})

export const useBuySellModalContext = () => useContext(BuySellModalContext)
