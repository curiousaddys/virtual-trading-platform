import { faCheckCircle, faExchangeAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ky from 'ky'
import type { FormEvent, FormEventHandler } from 'react'
import React, { useEffect, useState } from 'react'
import type { SingleValue } from 'react-select'
import Select from 'react-select'
import { toast } from 'react-toastify'
import type { Portfolio } from '../db/portfolios'
import { useAccountContext } from '../hooks/useAccount'
import type { CurrencyOption } from '../hooks/useBuySellModal'
import { useBuySellModalContext } from '../hooks/useBuySellModal'
import { usePricesContext } from '../hooks/usePrices'
import type { Price } from '../pages/api/prices'
import type { ErrResp } from '../utils/errors'
import { formatFloat, formatUSD } from '../utils/format'
import { FloatInput } from './common/FloatInput'
import { Modal } from './common/Modal'

enum TransactionState {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
}

export enum BuySellAction {
  Buy = 'buy',
  Sell = 'sell',
}

export const BuySellModal: React.VFC = () => {
  const { isOpen, hideModal, action, currency, setCurrency } = useBuySellModalContext()
  const [transactInUSD, setTransactInUSD] = useState<boolean>(true)
  const [amountUSD, setAmountUSD] = useState(0)
  const [amountCoin, setAmountCoin] = useState(0)
  const [coinPriceData, setCoinPriceData] = useState<Price | null>(null)
  const { prices } = usePricesContext()
  const { accountInfo, setAccountInfo } = useAccountContext()
  const [availableToSpend, setAvailableToSpend] = useState<number>(0)
  const [availableToSell, setAvailableToSell] = useState<number>(0)
  const [transactionStatus, setTransactionStatus] = useState<null | TransactionState>(null)

  const handleCurrencySelectionChange = (selectedOption: SingleValue<CurrencyOption>) => {
    if (!selectedOption) return
    setCurrency({ ...selectedOption })
  }

  const flipDenominations = (e: FormEvent) => {
    e.preventDefault()
    setTransactInUSD((prev) => !prev)
  }

  // Whenever price changes or input changes, update appropriate field based on which one is currently editable.
  // We can't just let the user update both fields whenever they want b/c one of them has to be constantly
  // updated based on the market price changes from the server.
  useEffect(() => {
    if (!coinPriceData) return
    if (transactInUSD) {
      const newAmountCoin = amountUSD / coinPriceData.current_price
      if (amountCoin !== newAmountCoin) {
        setAmountCoin(newAmountCoin)
      }
    } else {
      const newAmountUSD = amountCoin * coinPriceData.current_price
      if (amountUSD !== newAmountUSD) {
        setAmountUSD(newAmountUSD)
      }
    }
  }, [coinPriceData, transactInUSD, amountUSD, amountCoin])

  // Get current coin data whenever selected currency changes or prices update.
  useEffect(() => {
    if (!prices || !currency) return
    const coin = prices.find((price) => price.id === currency.value) ?? null
    setCoinPriceData(coin)
  }, [currency, prices])

  // Whenever account info or price data updates, set the available amount to spend or sell.
  useEffect(() => {
    setAvailableToSpend(
      accountInfo?.portfolio.holdings.find((holding) => holding.currency === 'USD')?.amount ?? 0
    )
    setAvailableToSell(
      accountInfo?.portfolio.holdings.find((holding) => holding.currency === coinPriceData?.id)
        ?.amount ?? 0
    )
  }, [accountInfo, coinPriceData])

  // // Reset values when modal is closed.
  useEffect(() => {
    if (!isOpen) {
      setTransactionStatus(null)
      setAmountCoin(0)
      setAmountUSD(0)
      setTransactInUSD(true)
    }
  }, [isOpen, currency])

  const handleSubmit: FormEventHandler = async (event) => {
    if (!coinPriceData || !accountInfo || !currency) return
    event.preventDefault()
    setTransactionStatus(TransactionState.Pending)
    await ky
      .post('/api/transaction', {
        searchParams: {
          portfolioID: accountInfo.portfolio._id.toString(),
          coin: coinPriceData.id,
          transactInUSD,
          amountUSD,
          amountCoin,
          action,
        },
      })
      .json<Portfolio>()
      .then((portfolio) => {
        setTransactionStatus(TransactionState.Success)
        setAccountInfo((prev) => (prev ? { ...prev, portfolio } : prev))
      })
      .catch((err) => {
        err.response.json().then((errResp: ErrResp) => {
          console.error(errResp)
          toast(`Transaction failed: ${errResp.error}.`, { type: 'error' })
        })
        setTransactionStatus(TransactionState.Failed)
      })
  }

  return isOpen ? (
    <Modal onClose={hideModal}>
      <div className="mt-3 text-center">
        {transactionStatus === 'success' ? (
          <div className="grid place-items-center gap-5">
            <FontAwesomeIcon icon={faCheckCircle} color="green" className="w-24" />
            Transaction successful.
            <button
              autoFocus
              onClick={hideModal}
              className="mt-3 px-4 py-2 bg-green-700 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              OK
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg leading-6 font-medium text-gray-900 capitalize">{action}</h3>
            <div className="mt-2 px-7 py-3">
              <form className="w-full max-w-sm" onSubmit={handleSubmit}>
                <div className="w-full text-left py-2 text-sm">
                  {action === BuySellAction.Buy ? (
                    <span>
                      <span className="font-bold">Available to spend:</span>
                      <br />
                      {formatUSD(availableToSpend)}{' '}
                      {coinPriceData ? (
                        <>
                          (~{availableToSpend / coinPriceData.current_price}{' '}
                          {coinPriceData.symbol.toUpperCase()})
                        </>
                      ) : null}
                    </span>
                  ) : coinPriceData ? (
                    <div className="w-full text-left py-2">
                      <span className="font-bold">Available to sell:</span>
                      <br />
                      {formatFloat(availableToSell, 16)} {coinPriceData.symbol.toUpperCase()} (~
                      {formatUSD(availableToSell * coinPriceData.current_price)})
                    </div>
                  ) : null}
                </div>

                {transactInUSD ? (
                  <>
                    {/*Editable USD amount*/}
                    <div className="flex items-center border-b border-teal-500 py-2">
                      <span className="text-gray-700 text-5xl text-center">$</span>
                      <FloatInput
                        className={`appearance-none bg-transparent border-none w-full mr-3 py-1 px-2 leading-tight focus:outline-none text-5xl text-center ${
                          (action === BuySellAction.Buy && amountUSD > availableToSpend) ||
                          (action === BuySellAction.Sell &&
                            coinPriceData &&
                            amountUSD > availableToSell * coinPriceData.current_price)
                            ? 'text-red-500'
                            : 'text-gray-700'
                        }`}
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        aria-label="Amount"
                        value={amountUSD}
                        precision={2}
                        onValueChange={(value) => setAmountUSD(value)}
                        autoFocus
                      />
                    </div>
                    {/*Non-editable coin amount*/}
                    <div className="flex items-center py-2">
                      <span className="text-gray-500 text-xl text-center">≈</span>
                      <div
                        className={`appearance-none bg-transparent border-none w-full mr-3 py-1 px-2 leading-tight focus:outline-none text-xl text-center text-gray-500`}
                      >
                        {amountCoin ? amountCoin : 0}
                      </div>
                      <span className="text-gray-500 text-xl text-center">
                        {coinPriceData?.symbol.toUpperCase()}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {/*Editable coin amount*/}
                    <div className="flex items-center border-b border-teal-500 py-2">
                      <FloatInput
                        className={`appearance-none bg-transparent border-none w-full mr-3 py-1 px-2 leading-tight focus:outline-none text-2xl text-center ${
                          (action === BuySellAction.Buy && amountUSD > availableToSpend) ||
                          (action === BuySellAction.Sell &&
                            coinPriceData &&
                            amountUSD > availableToSell * coinPriceData.current_price)
                            ? 'text-red-500'
                            : 'text-gray-700'
                        }`}
                        type="number"
                        inputMode="decimal"
                        maxLength={6}
                        placeholder="0"
                        aria-label="Amount"
                        value={amountCoin}
                        precision={16}
                        onValueChange={(value) => setAmountCoin(value)}
                        autoFocus
                      />
                      <span className="text-gray-700 text-xl text-center">
                        {coinPriceData?.symbol.toUpperCase()}
                      </span>
                    </div>
                    {/*Non-editable USD amount*/}
                    <div className="flex items-center py-2">
                      <span className="text-gray-500 text-xl text-center">≈</span>
                      <div
                        className={`appearance-none bg-transparent border-none w-full mr-3 py-1 px-2 leading-tight focus:outline-none text-xl text-center text-gray-500`}
                      >
                        {formatUSD(amountUSD ? amountUSD : 0)}
                      </div>
                    </div>
                  </>
                )}

                <div className="w-full flex py-2 text-left gap-2">
                  <Select
                    options={prices?.map((price) => ({
                      value: price.id,
                      label: price.name,
                    }))}
                    onChange={handleCurrencySelectionChange}
                    value={currency}
                    className="flex-grow"
                  />
                  <button
                    onClick={flipDenominations}
                    type="button"
                    className="bg-white hover:bg-gray-100 px-4 border border-gray-400 rounded shadow"
                  >
                    <FontAwesomeIcon icon={faExchangeAlt} className="rotate-90 w-[18px]" />
                  </button>
                </div>

                <div className="items-center px-4 py-1 pt-7">
                  <button
                    className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50 uppercase"
                    disabled={
                      !coinPriceData ||
                      (action === BuySellAction.Buy && amountUSD > availableToSpend) ||
                      (action === BuySellAction.Sell &&
                        amountUSD > availableToSell * coinPriceData.current_price) ||
                      amountUSD < 1 ||
                      transactionStatus === 'pending'
                    }
                    type="submit"
                  >
                    {action.toUpperCase()} now
                  </button>
                  <button
                    onClick={hideModal}
                    className="mt-3 px-4 py-2 bg-gray-400 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 uppercase"
                  >
                    Cancel
                  </button>
                  {/*Error messages*/}
                  {transactionStatus === 'failed' ? (
                    <div className="text-red-400 mt-5 font-bold">
                      Transaction failed.
                      <br />
                      Please try again.
                    </div>
                  ) : amountUSD > 0 && amountUSD < 1 ? (
                    <div className="text-red-400 mt-5 font-bold">
                      Transaction must be at least $1.
                    </div>
                  ) : null}
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </Modal>
  ) : null
}
