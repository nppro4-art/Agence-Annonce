import '../styles/globals.css'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Agence d&apos;Annonce — Vendez plus vite avec l&apos;IA</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="description" content="Générez des annonces professionnelles, répondez aux acheteurs, estimez le prix juste. Intelligence artificielle au service de votre vente."/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Bebas+Neue&display=swap" rel="stylesheet"/>
      </Head>
      <Component {...pageProps}/>
    </>
  )
}
