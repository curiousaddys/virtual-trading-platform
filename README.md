# virtual-trading-platform

> A virtual trading platform where you can explore the world of Cryptocurrency with no risk -- just log in with your wallet and get $100k free virtual USD to trade with!

## [Try it now!](https://trade.curiousaddys.com)

## setup

```bash
# if you don't already have it:
npm install -g pnpm

# clone the repo
git clone git@github.com:curiousaddys/virtual-trading-platform.git
cd virtual-trading-platform

# start MongoDB -- alternatively you can run your own MongoDB locally however you like!
docker compose up -d

# install dependencies
pnpm install

# build in watch mode
pnpm dev

# OR do a production build and run in production mode
pnpm build
pnpm start
```
