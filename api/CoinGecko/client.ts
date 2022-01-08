import got from 'got'
import { COINGECKO_BASE_URL } from '../../utils/constants'

const CoinGeckoAPI = got.extend({
  prefixUrl: COINGECKO_BASE_URL,
})

export default CoinGeckoAPI
