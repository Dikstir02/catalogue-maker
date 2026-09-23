import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import Catalogue from '@/pages/Catalogue';

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <TooltipProvider delayDuration={150}>
        <Catalogue />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App