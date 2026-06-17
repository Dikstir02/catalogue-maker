import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import Catalogue from '@/pages/Catalogue';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Catalogue />
      <Toaster />
    </QueryClientProvider>
  )
}

export default App