import { useContext, useEffect, useRef, useState } from 'react'
import Select from 'react-select'
import { usePrices } from '../hooks/usePrices'
import { formatUSD } from '../utils/format'
import { UserContext } from '../hooks/useUser'
import { GeckoPrices } from '../api/CoinGecko/markets'
import ky from 'ky'
import { Account } from '../db/accounts'

export interface BuySellModalProps {
  visible: boolean
  onClose: () => void
  // TODO: add types
  defaultCoin?: { value: string; label: string }
}

export const BuySellModal = (props: BuySellModalProps) => {
  const [amount, setAmount] = useState<number>(0)
  const [currency, setCurrency] = useState({
    // TODO: reconsider if we want a default value like this
    value: 'bitcoin',
    label: 'Bitcoin',
  })
  const [coin, setCoin] = useState<GeckoPrices | null>(null)
  const { prices } = usePrices()
  const amountInput = useRef<any>()
  const { accountInfo, setAccountInfo } = useContext(UserContext)
  const [availableToSpend, setAvailableToSpend] = useState<number>(0)
  const [transactionStatus, setTransactionStatus] = useState<
    null | 'pending' | 'success' | 'failed'
  >(null)

  // TODO: add types
  const handleCurrencySelectionChange = (selectedOption: any) => {
    setCurrency(selectedOption)
  }

  // Set selected currency whenever prop is passed in.
  useEffect(() => {
    if (!props.defaultCoin) return
    setCurrency(props.defaultCoin)
  }, [props.defaultCoin])

  // Get current coin data whenever selected currency changes or prices update.
  useEffect(() => {
    if (!prices || !currency) return
    const coin = prices.find((price) => price.id === currency.value)!
    setCoin(coin)
  }, [currency, prices])

  // Whenever modal becomes visible, set focus on the amount input & set it to 0 & reset transaction status.
  useEffect(() => {
    if (!props.visible) return
    setTransactionStatus(null)
    setAmount(0)
    if (amountInput.current) amountInput.current.focus()
  }, [props.visible])

  // Whenever account info updates, set the available amount to spend.
  useEffect(() => {
    setAvailableToSpend(
      accountInfo?.portfolios[0].holdings.find(
        (holding) => holding.currency === 'USD'
      )?.amount ?? 0
    )
  }, [accountInfo])

  // TODO: add type
  const handleSubmit = async (event: any) => {
    if (!coin || !accountInfo) return
    event.preventDefault()
    setTransactionStatus('pending')
    console.log(
      `Attempting to purchase ${amount / coin.current_price} ${
        currency.value
      } for ${amount}.`
    )
    await ky
      .post('/api/transaction', {
        searchParams: {
          portfolioID: accountInfo.portfolios[0]._id.toString(), // TODO: add support for other portfolios eventually
          coin: coin.id,
          amountUSD: amount,
          // TODO: add sell option
          action: 'buy',
        },
      })
      .json<Account>()
      .then((account) => {
        setTransactionStatus('success')
        setAccountInfo(account)
      })
      .catch((e) => {
        setTransactionStatus('failed')
      })
  }

  return (
    <div
      className={`z-50 fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full ${
        !props.visible && 'hidden'
      }`}
    >
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          {transactionStatus === 'success' && (
            <div>
              Success!
              <button
                onClick={(event) => {
                  event.preventDefault()
                  props.onClose()
                }}
                className="mt-3 px-4 py-2 bg-gray-400 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                CLOSE
              </button>
            </div>
          )}

          {transactionStatus !== 'success' && (
            <>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Buy
              </h3>
              <div className="mt-2 px-7 py-3">
                <form className="w-full max-w-sm" onSubmit={handleSubmit}>
                  <div className="w-full text-left py-2">
                    Available to spend: {formatUSD(availableToSpend)}
                  </div>
                  <div className="flex items-center border-b border-teal-500 py-2">
                    {/*TODO: allow switching to enter amount in coin currency instead of in USD*/}
                    <span className="text-gray-700 text-5xl text-center">
                      $
                    </span>
                    <input
                      className={`appearance-none bg-transparent border-none w-full mr-3 py-1 px-2 leading-tight focus:outline-none text-5xl text-center ${
                        amount > availableToSpend
                          ? 'text-red-500'
                          : 'text-gray-700'
                      }`}
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      aria-label="Amount"
                      value={amount}
                      onChange={(event) =>
                        setAmount(
                          event.target.value
                            ? parseFloat(event.target.value)
                            : 0
                        )
                      }
                      maxLength={7}
                      ref={amountInput}
                    />
                  </div>
                  <div className="w-full items-center py-2 text-left">
                    {/*TODO: if opening from a "Buy" button on the Prices list, default to that currency*/}
                    <Select
                      options={prices?.map((price) => ({
                        value: price.id,
                        label: price.name,
                      }))}
                      onChange={handleCurrencySelectionChange}
                      value={currency}
                    />
                  </div>
                  {coin && (
                    <>
                      <div className="w-full text-left py-2">
                        Exchange Price: {formatUSD(coin.current_price)}
                      </div>
                      <div className="w-full text-left py-2 font-bold">
                        Purchase amount:
                        <br />~{amount / coin.current_price}{' '}
                        {coin.symbol.toUpperCase()}
                      </div>
                    </>
                  )}

                  <div className="items-center px-4 py-1 pt-7">
                    <button
                      className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50"
                      disabled={
                        amount > availableToSpend ||
                        amount < 1 ||
                        !coin ||
                        transactionStatus === 'pending'
                      }
                      type="submit"
                    >
                      BUY NOW
                    </button>
                    <button
                      onClick={(event) => {
                        event.preventDefault()
                        props.onClose()
                      }}
                      className="mt-3 px-4 py-2 bg-gray-400 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      CANCEL
                    </button>
                    {transactionStatus === 'failed' && (
                      <div className="text-red-400 mt-3">
                        {/*TODO: figure out how to handle different errors and show better message*/}
                        ERROR SUBMITTING TRANSACTION (maybe not enough funds or
                        internal server error or other error?)
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </>
          )}
          {/*TODO: add option to buy or sell*/}
        </div>
      </div>
    </div>
  )
}
