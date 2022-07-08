import got from 'got'
import { COINGECKO_BASE_URL } from '../../utils/constants'

const CoinGeckoAPI = got.extend({
  prefixUrl: COINGECKO_BASE_URL,
  hooks: {
    afterResponse: [
      (response) => {
        const { statusCode, statusMessage } = response
        console.info(
          `CoinGecko API Call ${
            statusCode === 200 ? 'SUCCESS' : 'FAILED'
          }: ${statusCode} ${statusMessage}`
        )
        return response
      },
    ],
  },
})

export default CoinGeckoAPI
