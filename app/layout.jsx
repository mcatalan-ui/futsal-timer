import './globals.css'

export const metadata = {
  title: 'Futsal Timer',
  description: 'Contador de minutos para 10 jugadores'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <main style={{padding:20, fontFamily: 'Arial, sans-serif'}}>{children}</main>
      </body>
    </html>
  )
}
