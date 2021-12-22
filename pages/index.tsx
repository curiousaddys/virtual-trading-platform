import type { NextPage } from 'next'
import Image from 'next/image'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { GeckoPrices } from './api/prices'
import ky from 'ky'

const Home: NextPage = () => {
  // TODO(jh): maybe make a hook like you did for ALC API?
  const [isLoading, setIsLoading] = useState(true)
  const [prices, setPrices] = useState<GeckoPrices[] | null>(null)

  useEffect(() => {
    ;(async () => {
      const data = await ky.get('/api/prices').json<GeckoPrices[]>()
      console.log(data)
      setPrices(data)
      setIsLoading(false)
    })()
  }, [])

  return (
    <div>
      <Head>
        <title>Virtual Trading Platform</title>
        <meta name="description" content="Curious Addys' Trading Club" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Logo</th>
                <th>Name</th>
                <th>Current Price</th>
                <th>Price Change (24 hr)</th>
                <th>TODO</th>
              </tr>
            </thead>

            <tbody>
              {prices &&
                prices.map((coin) => (
                  <tr key={coin.id}>
                    <td>
                      <Image
                        src={coin.image}
                        height={40}
                        width={40}
                        alt={coin.symbol}
                      />
                    </td>
                    <td>{coin.name}</td>
                    <td>${coin.current_price}</td>
                    <td>
                      {/*TODO(jh): red is negative, green if positive*/}
                      {Math.round(coin.price_change_percentage_24h * 100) / 100}
                      %
                    </td>
                    <td>chart</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  )
}

export default Home
