import { 
    createConfig, 
    http, 
    cookieStorage,
    createStorage
  } from 'wagmi'
  import { metisSepolia } from 'wagmi/chains'
  
  export function getConfig() {
    return createConfig({
      chains: [metisSepolia],
      ssr: true,
      storage: createStorage({
        storage: cookieStorage,
      }),
      transports: {
        [metisSepolia.id]: http(),
      },
    })
  }