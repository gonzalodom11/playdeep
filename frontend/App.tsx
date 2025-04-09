import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
  </QueryClientProvider>
);

export default App